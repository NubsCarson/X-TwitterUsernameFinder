from flask import Flask, render_template, jsonify, request, send_from_directory, Response
from flask_socketio import SocketIO, emit
from flask_pymongo import PyMongo
from dotenv import load_dotenv
import os
import asyncio
import tweepy
import openai
import anthropic
import google.generativeai as genai
import json
import base58
import nacl.signing
import requests
import nest_asyncio
from datetime import datetime, timedelta
import time
import httpx

# Load environment variables
load_dotenv()

# Apply nest_asyncio to allow nested event loops
nest_asyncio.apply()

app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'fallback_secret_key_for_development')
app.config['MONGO_URI'] = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/aitwitter')
socketio = SocketIO(app, cors_allowed_origins="*")
mongo = PyMongo(app)

# Create a new event loop for the application
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

# Pro User operations moved to MongoDB
def add_pro_user(wallet_address):
    mongo.db.pro_users.insert_one({
        'wallet_address': wallet_address,
        'created_at': datetime.utcnow()
    })

def get_pro_user(wallet_address):
    return mongo.db.pro_users.find_one({'wallet_address': wallet_address})

class TwitterHandleChecker:
    def __init__(self, bearer_token):
        self.client = tweepy.Client(bearer_token=bearer_token)
        self.rate_limit = 50  # Basic tier rate limit
        self.requests_made = 0
        self.reset_time = datetime.now() + timedelta(minutes=15)

    async def check_handle(self, handle):
        if self.requests_made >= self.rate_limit:
            wait_time = (self.reset_time - datetime.now()).total_seconds()
            if wait_time > 0:
                await self.wait_with_countdown(wait_time)
                self.requests_made = 0
                self.reset_time = datetime.now() + timedelta(minutes=15)

        try:
            response = self.client.get_user(username=handle)
            self.requests_made += 1
            return {"handle": handle, "available": response.data is None}
        except Exception as e:
            return {"handle": handle, "error": str(e)}

    async def check_handles(self, usernames):
        results = []
        total = len(usernames)
        checked = 0

        for username in usernames:
            result = await self.check_handle(username)
            results.append(result)
            checked += 1
            progress = (checked / total) * 100
            emit('progress', {'progress': progress, 'result': result})

        return results

    async def wait_with_countdown(self, seconds):
        start_time = time.time()
        while time.time() - start_time < seconds:
            remaining = seconds - (time.time() - start_time)
            emit('waiting', {'seconds': int(remaining)})
            await asyncio.sleep(1)

class UsernameGenerator:
    def __init__(self, api_key):
        self.api_key = api_key
        self.client = None

    def _initialize_client(self):
        if not self.client:
            from openai import OpenAI
            self.client = OpenAI(api_key=self.api_key)

    def generate_usernames(self, prompt, count=5):
        self._initialize_client()
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a creative username generator. Generate unique, available, and memorable usernames."},
                    {"role": "user", "content": f"Generate {count} unique usernames based on: {prompt}"}
                ]
            )
            usernames = response.choices[0].message.content.strip().split('\n')
            return [username.strip('- ') for username in usernames if username.strip('- ')]
        except Exception as e:
            print(f"Error generating usernames: {e}")
            return []

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('check_handles')
def handle_check(data):
    bearer_token = data.get('bearer_token')
    usernames = data.get('usernames', [])

    checker = TwitterHandleChecker(bearer_token)
    loop = asyncio.get_event_loop()
    loop.run_until_complete(checker.check_handles(usernames))

@socketio.on('generate_usernames')
def handle_generate(data):
    provider = data.get('provider', 'openai')
    model = data.get('model', 'gpt-3.5-turbo')
    api_key = data.get('api_key')
    prompt = data.get('prompt')
    count = int(data.get('count', 10))

    generator = UsernameGenerator(api_key)
    usernames = generator.generate_usernames(prompt, count)
    emit('usernames', {'usernames': usernames})

@app.route('/verify-wallet', methods=['POST'])
def verify_wallet():
    data = request.json
    wallet_address = data.get('wallet_address')
    signature = data.get('signature')
    message = data.get('message')
    
    print(f"Verifying wallet: {wallet_address}")
    print(f"Signature length: {len(signature) if signature else 'None'}")
    
    try:
        # Check if user is already pro
        pro_user = get_pro_user(wallet_address)
        if pro_user:
            print(f"Found existing pro user: {wallet_address}")
            return jsonify({'status': 'success', 'is_pro': True})
            
        # Verify the signature
        try:
            import base64
            from nacl.signing import VerifyKey
            from nacl.exceptions import BadSignatureError
            
            decoded_public_key = base58.b58decode(wallet_address)
            print(f"Decoded public key length: {len(decoded_public_key)}")
            
            verify_key = VerifyKey(bytes(decoded_public_key))
            
            decoded_signature = base64.b64decode(signature)
            print(f"Decoded signature length: {len(decoded_signature)}")
            
            verify_key.verify(message.encode(), decoded_signature)
            print(f"Signature verified for wallet: {wallet_address}")
            return jsonify({'status': 'success', 'is_pro': False})
        except BadSignatureError:
            print("Bad signature")
            return jsonify({'status': 'error', 'message': 'Invalid signature: Bad signature'}), 400
        except Exception as sig_err:
            print(f"Signature verification failed: {str(sig_err)}")
            print(f"Signature details - Length: {len(signature) if signature else 'None'}")
            return jsonify({'status': 'error', 'message': f'Invalid signature: {str(sig_err)}'}), 400
            
    except Exception as e:
        print(f"Wallet verification error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/add-pro-user', methods=['POST'])
def add_pro_user_route():
    data = request.json
    wallet_address = data.get('wallet_address')
    signature = data.get('signature')
    message = data.get('message')
    
    print(f"Registering pro user: {wallet_address}")
    print(f"Signature length: {len(signature) if signature else 'None'}")
    
    try:
        # Check if user is already pro
        existing_user = get_pro_user(wallet_address)
        if existing_user:
            print(f"User already pro: {wallet_address}")
            return jsonify({'status': 'success'})

        # Verify the signature
        try:
            import base64
            from nacl.signing import VerifyKey
            from nacl.exceptions import BadSignatureError
            
            decoded_public_key = base58.b58decode(wallet_address)
            print(f"Decoded public key length: {len(decoded_public_key)}")
            
            verify_key = VerifyKey(bytes(decoded_public_key))
            
            decoded_signature = base64.b64decode(signature)
            print(f"Decoded signature length: {len(decoded_signature)}")
            
            verify_key.verify(message.encode(), decoded_signature)
            print(f"Signature verified for new pro user: {wallet_address}")
        except BadSignatureError:
            print("Bad signature")
            return jsonify({'status': 'error', 'message': 'Invalid signature: Bad signature'}), 400
        except Exception as sig_err:
            print(f"Signature verification failed for new pro user: {str(sig_err)}")
            print(f"Signature details - Length: {len(signature) if signature else 'None'}")
            return jsonify({'status': 'error', 'message': f'Invalid signature: {str(sig_err)}'}), 400
        
        # Add user to pro users
        add_pro_user(wallet_address)
        print(f"Successfully registered pro user: {wallet_address}")
        
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"Pro user registration error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/check-usernames', methods=['POST'])
def check_usernames():
    data = request.json
    bearer_token = data.get('bearer_token')
    usernames = data.get('usernames', [])
    
    if not bearer_token or not usernames:
        return jsonify({'error': 'Missing required parameters'}), 400

    headers = {
        'Authorization': f'Bearer {bearer_token}',
        'Content-Type': 'application/json'
    }

    results = []
    for i, username in enumerate(usernames):
        try:
            # Check if username exists using Twitter API
            response = requests.get(
                f'https://api.twitter.com/2/users/by/username/{username}',
                headers=headers
            )
            
            # Calculate progress
            progress = ((i + 1) / len(usernames)) * 100
            socketio.emit('progress_update', {'progress': progress})

            if response.status_code == 404:
                # Username is available
                results.append({
                    'username': username,
                    'status': 'available',
                    'message': 'Available!'
                })
            elif response.status_code == 200:
                # Username is taken
                results.append({
                    'username': username,
                    'status': 'taken',
                    'message': 'Already taken'
                })
            elif response.status_code == 429:
                # Rate limit hit
                wait_time = int(response.headers.get('x-rate-limit-reset', 900))
                socketio.emit('rate_limit', {'waitTime': wait_time})
                results.append({
                    'username': username,
                    'status': 'error',
                    'message': f'Rate limit reached. Try again in {wait_time} seconds.'
                })
            else:
                results.append({
                    'username': username,
                    'status': 'error',
                    'message': f'Error: {response.status_code}'
                })

            # Add a small delay to avoid hitting rate limits too quickly
            time.sleep(0.5)

        except Exception as e:
            results.append({
                'username': username,
                'status': 'error',
                'message': f'Error: {str(e)}'
            })

    return jsonify({
        'results': results
    })

@app.route('/config')
def get_config():
    rpc_endpoint = os.getenv('SOLANA_RPC_ENDPOINT')
    if not rpc_endpoint:
        return jsonify({'error': 'RPC endpoint not configured'}), 500
        
    # Ensure RPC endpoint starts with https:// if not already present
    if not rpc_endpoint.startswith('http'):
        rpc_endpoint = f'https://{rpc_endpoint}'
        
    return jsonify({
        'rpc_endpoint': rpc_endpoint
    })

if __name__ == '__main__':
    load_dotenv()
    app.run(debug=True)  # For local development

# Vercel handler
def handler(event, context):
    """Handle requests in a serverless context."""
    return app(event, context) 
from app import app
from flask import Flask, request

def handler(event, context):
    """Handle serverless function event."""
    
    # Get client IP for logging
    client_ip = event.get('headers', {}).get('x-forwarded-for', 'Unknown')
    print(f"Request from IP: {client_ip}")
    
    # Create WSGI environment
    environ = {
        'REQUEST_METHOD': event.get('method', ''),
        'SCRIPT_NAME': '',
        'PATH_INFO': event.get('path', ''),
        'QUERY_STRING': event.get('query', ''),
        'SERVER_NAME': 'vercel',
        'SERVER_PORT': '443',
        'SERVER_PROTOCOL': 'HTTP/1.1',
        'wsgi.version': (1, 0),
        'wsgi.url_scheme': 'https',
        'wsgi.input': '',
        'wsgi.errors': '',
        'wsgi.multithread': False,
        'wsgi.multiprocess': False,
        'wsgi.run_once': False,
    }

    # Add headers
    for key, value in event.get('headers', {}).items():
        key = key.upper().replace('-', '_')
        if key not in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
            key = f'HTTP_{key}'
        environ[key] = value

    # Response data
    response_data = {}

    def start_response(status, headers):
        response_data['statusCode'] = int(status.split()[0])
        response_data['headers'] = dict(headers)

    # Get response body
    response_body = b''.join(app(environ, start_response))
    if isinstance(response_body, bytes):
        response_body = response_body.decode('utf-8')

    response_data['body'] = response_body
    return response_data 
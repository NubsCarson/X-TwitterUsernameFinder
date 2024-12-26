from app import app

# This is the Vercel serverless function entry point
def handler(request, context):
    return app(request) 
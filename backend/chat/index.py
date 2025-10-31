import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Генерация умных ответов Delta AI через Mistral AI
    Args: event с httpMethod, body (message)
    Returns: HTTP response с ответом бота
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    user_message: str = body_data.get('message', '')
    user_image: str = body_data.get('image', '')
    
    if not user_message and not user_image:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Message or image is required'})
        }
    
    api_key = os.environ.get('MISTRAL_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'MISTRAL_API_KEY not configured'})
        }
    
    import requests
    
    mistral_url = 'https://api.mistral.ai/v1/chat/completions'
    
    messages = [
        {
            'role': 'system',
            'content': 'Ты Delta AI - дружелюбный и умный русскоязычный ассистент с возможностью анализа изображений. Отвечай кратко, понятно и по делу. Используй эмодзи где уместно. Если пользователь отправил изображение, опиши что на нём видишь.'
        }
    ]
    
    if user_image:
        messages.append({
            'role': 'user',
            'content': [
                {
                    'type': 'text',
                    'text': user_message if user_message else 'Что на этом изображении?'
                },
                {
                    'type': 'image_url',
                    'image_url': user_image
                }
            ]
        })
    else:
        messages.append({
            'role': 'user',
            'content': user_message
        })
    
    payload = {
        'model': 'pixtral-12b-2409',
        'messages': messages,
        'temperature': 0.7,
        'max_tokens': 500
    }
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(mistral_url, json=payload, headers=headers, timeout=30)
    
    if response.status_code != 200:
        return {
            'statusCode': response.status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'error': 'Mistral API error',
                'details': response.text
            })
        }
    
    result = response.json()
    bot_response = result['choices'][0]['message']['content']
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'response': bot_response,
            'request_id': context.request_id
        })
    }
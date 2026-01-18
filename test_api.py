import requests
import json

url = 'https://router.huggingface.co/hf-inference/models/nlptown/bert-base-multilingual-uncased-sentiment'
headers = {'Authorization': 'Bearer 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'}
payload = {'inputs': 'Match incroyable !'}

try:
    response = requests.post(url, headers=headers, json=payload, timeout=10)
    print(f'Status Code: {response.status_code}')
    print('Response JSON:')
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f'Error: {e}')

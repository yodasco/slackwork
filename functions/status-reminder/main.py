print "start"

import json
import boto3
from base64 import b64decode
from urlparse import parse_qs
import logging
import urllib2


ENCRYPTED_TOKEN = "CiBhDm/DKv0XspkiRcaOD4Ir0myzUo9UNGPhofvZRUM3uhKfAQEBAgB4YQ5vwyr9F7KZIkXGjg+CK9Jss1KPVDRj4aH72UVDN7oAAAB2MHQGCSqGSIb3DQEHBqBnMGUCAQAwYAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAzPsINI3gPSaNiIv+8CARCAM05eRzdaun+cdEU8ybiQe000d84i+6VSixQfxttQIR75n9k8WVBh8GoH2Ro8AxMVeY22Ug=="

kms = boto3.client('kms')
token = kms.decrypt(CiphertextBlob = b64decode(ENCRYPTED_TOKEN))['Plaintext']

SLACK_URL = 'https://yodas.slack.com/services/hooks/incoming-webhook?token=' + token

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handle(event, context):
    payload = {
        "channel": "#status",
        "username": "webhookbot",
        "text": "Yo everybody don't forget to post your daily update!",
        "icon_emoji": ":monkey_face:"
    }

    req = urllib2.Request(SLACK_URL, json.dumps(payload))
    response = urllib2.urlopen(req)
    result = response.read()
    print result
    return "OK"

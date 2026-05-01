#!/usr/bin/env python3
"""Template script to upload an AAB to Google Play using the Google API.

This file is a template and requires a service-account JSON file and the
`google-api-python-client` and `google-auth` packages. Do NOT commit service
account JSON to the repo. Place it outside the repository and reference it via
environment variable `PLAY_SERVICE_ACCOUNT`.
"""
import os
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

SERVICE_ACCOUNT = os.environ.get('PLAY_SERVICE_ACCOUNT')
PACKAGE_NAME = os.environ.get('PLAY_PACKAGE_NAME')
AAB_PATH = sys.argv[1] if len(sys.argv) > 1 else None

if not SERVICE_ACCOUNT or not PACKAGE_NAME or not AAB_PATH:
    print('Missing required inputs. Set PLAY_SERVICE_ACCOUNT, PLAY_PACKAGE_NAME, and pass AAB path as argument.')
    sys.exit(1)

SCOPES = ['https://www.googleapis.com/auth/androidpublisher']

creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT, scopes=SCOPES)
service = build('androidpublisher', 'v3', credentials=creds)

edits = service.edits()
edit_request = edits.insert(body={}, packageName=PACKAGE_NAME)
result = edit_request.execute()
edit_id = result['id']

print('Uploading:', AAB_PATH)
bundle_response = edits.bundles().upload(packageName=PACKAGE_NAME, editId=edit_id, media_body=AAB_PATH).execute()
print('Upload response:', bundle_response)

print('Committing edit...')
commit_response = edits.commit(packageName=PACKAGE_NAME, editId=edit_id).execute()
print('Commit response:', commit_response)

import hashlib
import sys

def encrypt_string(hash_string):
    sha_signature = \
        hashlib.sha256(hash_string.encode()).hexdigest()
    return sha_signature

hash_string = sys.argv[1]

sha_signature = encrypt_string(hash_string)

print(sha_signature, end="")
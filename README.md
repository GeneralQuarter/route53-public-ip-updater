# route53-public-ip-updater

Periodically updates an A record in AWS Route 53 with the public ip of the machine.

Your home ip keeps changing and you need to share an easy url to your friends for your game server and you have a domain setup in Route 53? This is for you.

Run this docker image on your server and it will automatically update the A record for you.

## Environment variables

Here are the required environment variables:

```
# AWS - the IAM user will need access to write ChangeResourceRecordSets on the hosted id that you configure below
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***
# This needs to be set even if route 53 is global
AWS_REGION=***

# Hosted zone id of the (sub-)domain you want to add an A record to
ROUTE53_HOSTED_ZONE_ID=AAAAAAAAAAAA
# Name of the (sub-)domain
ROUTE53_DOMAIN_NAME=example.com

# Service to get your public ip
PUBLIC_IP_GET_URL=https://ifconfig.me

# How often you want to check your public ip in milliseconds (will only update it if changed)
REFRESH_RATE_MS=60000
```

## Run

with `.env` file (see above)

```
docker run -it --env-file .env generalquarter/route53-public-ip-updater:latest
```

## Build

```
npm i

npm run build

docker build . -t route53-public-ip-updater:latest
```
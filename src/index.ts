import { config } from 'dotenv';
import axios from 'axios';

import { Route53Client, ChangeResourceRecordSetsCommand } from '@aws-sdk/client-route-53';

class EnvironmentVariableNotFoundError extends Error {
  constructor(key: string) {
    super(`Environment variable "${key}" not set`);
  }
}

function getEnvVariable(key: string) {
  const value = process.env[key];

  if (!value) {
    throw new EnvironmentVariableNotFoundError(key);
  }

  return value;
}

async function getPublicIp() {
  const publicIpGetURL = getEnvVariable('PUBLIC_IP_GET_URL');

  return axios.get<string>(publicIpGetURL).then(res => res.data);
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateRecordUpsertCommand(publicIp: string) {
  const hostedZoneId = getEnvVariable('ROUTE53_HOSTED_ZONE_ID');
  const domainName = getEnvVariable('ROUTE53_DOMAIN_NAME');

  return new ChangeResourceRecordSetsCommand({
    HostedZoneId: hostedZoneId,
    ChangeBatch: {
      Comment: `Updating the A record via route53-public-ip-updater`,
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: domainName,
            Type: 'A',
            TTL: 60,
            ResourceRecords: [
              {
                Value: publicIp
              }
            ]
          }
        }
      ]
    }
  });
}

async function updateARecord(client: Route53Client, previousIp: string) {
  const ip = await getPublicIp();

  if (ip === previousIp) {
    console.log(`Same ip as before, record update skipped`);
    return ip;
  }

  const command = generateRecordUpsertCommand(ip);

  await client.send(command);

  console.log(`Successfully updated record with new ip`);

  return ip;
}

async function run() {
  config();

  const refreshRateMs = parseInt(getEnvVariable('REFRESH_RATE_MS'));

  if (isNaN(refreshRateMs) || refreshRateMs < 0) {
    throw new Error(`Environment variable "REFRESH_RATE_MS" should be a valid positive integer`);
  }

  const client = new Route53Client({});

  let previousIp = '';

  console.log('Started route53 public ip updater');

  while (true) {
    try {
      await delay(refreshRateMs);
      previousIp = await updateARecord(client, previousIp);
    } catch (e) {
      if (e instanceof EnvironmentVariableNotFoundError) {
        throw e;
      }

      if (e instanceof Error) {
        console.error(`Could not update record this time: ${e.message}`);
      }
    }
  }
}

(async () => {
  try {
    await run();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})()
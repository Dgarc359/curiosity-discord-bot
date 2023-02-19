import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import nacl from "tweetnacl";
import { ssmCredentials } from "@curiosity/core/ssm";
import axios from 'axios';

const { CURIOSITY_BOT_PUBLIC_KEY, NASA_API_KEY } = await ssmCredentials([
  "CURIOSITY_BOT_PUBLIC_KEY",
  "NASA_API_KEY",
]);

const BadRequest = {
  statusCode: 401,
  body: "Bad Request",
};

export const handler: APIGatewayProxyHandlerV2<any> = async (event) => {
  if (!CURIOSITY_BOT_PUBLIC_KEY)
    throw new Error("Error retrieving credentials");

  const { body, headers } = event;
  if (!body) return BadRequest;

  const signature = headers["x-signature-ed25519"];
  const timestamp = headers["x-signature-timestamp"];

  if (!signature || !timestamp) return BadRequest;

  const isVerified = nacl.sign.detached.verify(
    Buffer.from(timestamp + body),
    Buffer.from(signature, "hex"),
    Buffer.from(CURIOSITY_BOT_PUBLIC_KEY, "hex")
  );

  if (!isVerified) {
    return BadRequest;
  }

  const parsedBody = JSON.parse(body);
  console.debug("parsed Body", parsedBody);
  const { type: kind, data } = JSON.parse(body);

  if (kind === 1) {
    return {
      statusCode: 200,
      body: body,
    };
  } else if (kind === 2) {
    const { name } = data;
    if (!name) return BadRequest;
    if (name === "apod") {
      const response: {
        data: { url: string; title: string; explanation: string };
      } = await axios.get(
        `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`
      );

      console.debug(response.data.url);

      return {
        type: 4,
        data: {
          content: response.data.explanation,
          tts: "false",
          embeds: [
            {
              type: "rich",
              title: response.data.title,
              color: 0x00ffff,
              image: {
                url: response.data.url,
                height: 0,
                width: 0,
              },
            },
          ],
        },
      };
    } else {
      return BadRequest;
    }
  }
  return BadRequest;
};

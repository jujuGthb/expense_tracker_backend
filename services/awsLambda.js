// Import the AWS Lambda client
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

// Create Lambda client
const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

exports.invokeLambda = async (
  functionName,
  payload,
  invocationType = "RequestResponse"
) => {
  if (!functionName) {
    throw new Error("Lambda function name is required");
  }

  try {
    console.log(`Invoking Lambda function: ${functionName}`);
    console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);

    const params = {
      FunctionName: functionName,
      InvocationType: invocationType,
      Payload: Buffer.from(JSON.stringify(payload)),
    };

    const command = new InvokeCommand(params);
    const response = await lambdaClient.send(command);

    if (response.StatusCode !== 200) {
      throw new Error(
        `Lambda invocation failed with status code: ${response.StatusCode}`
      );
    }

    // Parse the response payload if it's a synchronous request
    if (invocationType === "RequestResponse" && response.Payload) {
      const responsePayload = Buffer.from(response.Payload).toString();
      console.log(`Lambda response: ${responsePayload}`);

      try {
        return JSON.parse(responsePayload);
      } catch (parseError) {
        console.error("Error parsing Lambda response:", parseError);
        return {
          error: "Failed to parse Lambda response",
          rawResponse: responsePayload,
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Lambda invocation error:", error);
    throw new Error(`Failed to invoke Lambda function: ${error.message}`);
  }
};

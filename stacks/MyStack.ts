import { AccountRootPrincipal, Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { StackContext, Api, Function } from "sst/constructs";
import { registerCommands } from "../packages/core/src/register-commands";

export async function Stack({ stack, app }: StackContext) {

  console.log("registering commands")
  await registerCommands();
  console.log("registered commands")

  const lambdaServicePrincipal = new ServicePrincipal(
    "lambda.amazonaws.com"
  );
  const lambdaServiceAssumedRole = new Role(
    stack,
    app.logicalPrefixedName('lambda-role'),
    {
      assumedBy: lambdaServicePrincipal,
      description: `Assume role for ${app.name} lambda service`
    }
  );

  const kmsPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      "kms:Decrypt",
      "kms:Encrypt",
    ],
    resources: ["*"],
  });

  kmsPolicy.addCondition("StringLike", { "kms:RequestAlias": "alias/aws/ssm"});

  lambdaServiceAssumedRole.addToPolicy(kmsPolicy);

  lambdaServiceAssumedRole.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      "ssm:GetParameters",
      "ssm:GetParameter",
      "ssm:GetParameterByPath"
    ],
    resources: ["*"]
  }));

  lambdaServiceAssumedRole.addManagedPolicy(
    ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
  );

  const curiosityFn = new Function(
    stack,
    app.logicalPrefixedName(`curiosity-fn`),
    {
      functionName: app.logicalPrefixedName(`curiosity-fn`),
      handler: `packages/functions/src/curiosity.handler`,
      runtime: 'nodejs16.x',
      role: lambdaServiceAssumedRole,
      url: true
    }
  )
  // const api = new Api(stack, "api", {
  //   routes: {
  //     "GET /": "packages/functions/src/lambda.handler",
  //   },
  // });
  stack.addOutputs({
    functionUrl: curiosityFn.url
  });
}

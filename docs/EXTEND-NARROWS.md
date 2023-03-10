# How to extend narrows with more consumers

## Background
In release 0.3, we have added a new component called "Exporter", it can decouple the scanners with the consumers.
The scanners just need to care about how to do the security check and generate the report. Exporter will start
to take care of how to handle the connections to the consumers.

The purpose of the doc is to tell you how to extend the Exporter to send the report to a new consumer.

The [design doc](design/data-exporter-phase-1.md) can give you more details about what is the Exporter.

## How to extend consumers
Suppose, we are now adding a consumer, Slack.

### Extend the policy
Which scanner will send report to which consumer is defined in the policy. So in order to send the report to
Slack, firstly the [definition of the policy](../src/api/v1alpha1/inspectionpolicy_types.go) should be changed.
You need to add the necessary info for constructing a http request to send a msg to slack. the necessary info
can be basic auth strings, and also can be an endpoint of you AWS lambda function which always return a valid
token for you to access your consumer.

Your need to extend the ExportConfig struct in the policy's definition file. This struct is a part of
the protocol between the scanners and the Exporter. Our existing scanners will seal this part of information
in to the request.

After that, remember to run `make generate` and `make gen-yaml-files` to update the auto-generated code.

The logic of the scanner need not be changed because it doesn't care about the details of the ExporterConfig,
it just adds it as the header when sending payloads to the Exporter

### Extend the exporter

You need to add a go file under this [dir](../src/pkg/exporter/outputs), called slack.go, and add a function
called `SlackPost`. The parameter should be a string payload which is from the scanners. The job of `SlackPost`
is to convert this payload to something Slack can recognize. So you need to define a struct based on Slack's
protocol, construct it based on the payload and unmarshal it into a string then forward to the Slack endpoint.

Your `SlackPost` function should be based on our `Post` function in [client.go](../src/pkg/exporter/outputs/client.go)
to send the http request to Slack endpoint. We should consider reusing our code first, because using a SDK
provided by Slack could make the image larger. If every developer extend the Exporter like that, the image size
of Exporter could be too large.

In the [main.go](../src/pkg/exporter/cmd/main.go) file, you need also to extend the forwardEvent function.
Append the logic at the end of the function, which establish the connection with Slack anb calls your `SlackPost`
function.

## How to extend scanners

### The place of your code
The scanners' code is under the [inspectors](../src/pkg/inspectors) directory. You should create a new folder
under the directory. Put everything only related to your scanner inside the sub-directory you created.

### Extend the Policy
The [definition of the policy](../src/api/v1alpha1/inspectionpolicy_types.go) should be changed. You need to
extend the `Inspector` struct, add a field to point to your scanner's image.

### Extend the policy's reconciler
At release 0.3, Narrows provisions the scanner workloads during reconciling the policy. You need to add the
logic about how to provision your scanner in [inspectionpolicy_controller.go](../src/controllers/inspectionpolicy_controller.go).

## Add UT and e2e test

UT file should be added beside the production code file.

E2E file should be added under the [e2e](../src/test/e2e) directory. Please check the [contributing doc](../CONTRIBUTING.md)
for the detail.
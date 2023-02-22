# Data Exporter Phase I

## Abstract
We are going to add a component called data exporter, who defines a protocol and holds an endpoint.
Any scanner obeying the protocol can send the data to the endpoint. Then the data exporter can help
to send the data to anywhere.

## Background
### Problem Statement

Currently, in each scanner's code, we have coupling functionalities:

The scanners need not only to scan, define the report struct, but also need to
handle the connection to the consumers, such as Opensearch. This will cause a problem:

* When a developer needs to integrate a new scanner, this person needs to write the
code about how this new scanner send the report to every consumer.
* When a developer needs to support a new consumer, this person needs to write the
code about how to send each scanner's report to this new consumer.

Above 2 problems prevent Narrows to be an extensible project. This is why we want to
decouple scanner and the client of the consumers.

### Proposal

We are going to have another deployment of pods called Data-Exporter in Narrows.
This new component, has the extensible capability to forward the report from any
scanner to any consumer.

With Data-Exporter, a scanner just need to:
* Generate the report data as a json-formatted string
* Still get the consumer information from the policy
* Put the above contents into an envelop regarding the protocol of the data exporter
* Call the endpoint of Data-Exporter 

After that, when a new scanner is added into Narrows, it just need to care about how to send data to
data exporter.

When a new consumer is added into Narrows, it just need to change a little code of data exporter.
We will mark the places where the code should be changed.

## Goals
* Install a deployment of data exporter when user installs Narrows.
* Make the current 3 scanners to call the endpoint to send the report.
* Define the protocol between the scanners and the data exporter.
* The data exporter should have no aware of the detailed mapping of the report.

## None-Goals at phase 1
* Split this data exporter to resource collector, db, analyst and the phase 2 data exporter.
* Eliminate the Cronjobs-typed scanners.

## High-Level Design
![img.png](../pictures/exporter-arch.png)

* The scanners will keep reading the consumer information from the policy.
* The scanners will keep generate the report, they define the struct of their reports and marshal to json.
* The cluster id, node id, and the scanner's name will be a part of the report.
* The ReportData is the protocol between scanner and the exporter, it contains two parts of data:
  * The consumers of the report.
  * The report payloads.
* The exporter is a deployment with an internal service in the K8s cluster, exposed by port 6780.
* The exporter will unwrap the ReportData, get the config, and forward the payload based on the config.

## Detailed Design


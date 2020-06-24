# Capture span for apigee edge
This is the lightweigh/trimmed version of capturing span for an apigee edge based on W3C trace context.

There are 3 flow components that may interests you.

## NRTraceReceiver
This script decodes the traceparent and tracestate headers of W3C trace context.

## NRTracePrepare
This script set context just before calling Newrelic Trace API.

## NewRelicAPI
This component inserts span for apigee edge via Newrelic Trace API
//Get timestamp from the apigee flow variables
 var start = context.getVariable("target.sent.start.timestamp");
 var end = context.getVariable("target.received.end.timestamp");
 var apigeeStart = context.getVariable("client.received.start.timestamp")
 context.setVariable("dt.targetDuration",(end-start)+"");
 context.setVariable("dt.targetStart",start+"");
 context.setVariable("dt.apigeeDuration",(end-apigeeStart)+"");
 

 var sampled = context.getVariable("dt.sampled");
 var sendNRTracePayload=sampled;
 var selfSampled = false;
 
 //Sample anyway if response is slow
 if(!sampled) {
     if((end-apigeeStart) > 5000) { //apige flows > ##ms get sampled and traced
         sendNRTracePayload = true;
         selfSampled = true;
     }
 }
 
//process the internal spans so they can be added to the trace payload
var internalSpansString="";
context.setVariable("dt.sendNRTracePayload",sendNRTracePayload);
context.setVariable("dt.selfSampled",selfSampled);
context.setVariable("dt.internalSpans",internalSpansString);

//Set target start timestamp in tracestate header
var w3TraceState = context.getVariable("dt.w3TraceState"); 
//print("w3 trace state in Prepare Before:"+w3TraceState);
var targetTS = context.getVariable("dt.targetTS");
var ns = w3TraceState.indexOf(targetTS);
var strs = w3TraceState.substr(0, ns);
w3TraceState = strs+start;
context.setVariable("request.header.tracestate", w3TraceState);
//print("w3 trace state in Prepare After:"+w3TraceState);

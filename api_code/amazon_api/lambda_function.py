import os
import io
import boto3
import json
import csv

# grab environment variables
ENDPOINT_NAME = os.environ['ENDPOINT_NAME']
runtime= boto3.client('runtime.sagemaker')

def query(model_predictor, text):
    """Query the model predictor."""

    encoded_text = json.dumps(text).encode("utf-8")

    query_response = model_predictor.predict(
        encoded_text,
        {
            "ContentType": "application/x-text",
            "Accept": "application/json",
        },
    )
    return query_response


def parse_response(query_response):
    """Parse response and return summary text."""

    model_predictions = json.loads(query_response)
    translation_text = model_predictions["summary_text"]
    return translation_text


def lambda_handler(event, context):
    
    
    
    print("Received event: " + json.dumps(event, indent=2))
    
    data = json.loads(json.dumps(event))
    payload = data
    print(payload) # string as payload
    
    endpoint_result = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                       ContentType='application/x-text',
                                       Body=payload) 
                                       # give payload to endpoint. return response.
    # print(f"model_predictor result: {str(model_predictor)}")
    key_list = list(endpoint_result.values())
    model_predictor = key_list[3]
    print(model_predictor)
    result = json.loads(endpoint_result['Body'].read().decode())
    # print(result)
    print(list(result.values()))
    result_list = list(result.values())
    result_string = result_list.pop(0)
    # model = model_predictor.Body
    # print(str(model))
    
    
    
    
    
    
    # newline, bold, unbold = "\n", "\033[1m", "\033[0m"

    # input_text = "The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure "
    
    # query_response = query(model_predictor, input_text)
    
    # summary_text = parse_response(query_response)
    
    # print(f"Input text: {input_text}{newline}" f"Summary text: {bold}{summary_text}{unbold}{newline}")
   
    
    # return f"Input text: {input_text}{newline}" f"Summary text: {bold}{summary_text}{unbold}{newline}"
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST'
        },
        'body': result_string
    }  
    #############################
    
    

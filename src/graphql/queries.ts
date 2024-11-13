/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getVerdureTelemetryLogs = /* GraphQL */ `query GetVerdureTelemetryLogs($data_type: String!, $timestamp: Int!) {
  getVerdureTelemetryLogs(data_type: $data_type, timestamp: $timestamp) {
    data_type
    timestamp
    ph_levels
    temperature
    humidity
    light_level
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetVerdureTelemetryLogsQueryVariables,
  APITypes.GetVerdureTelemetryLogsQuery
>;
export const listVerdureTelemetryLogs = /* GraphQL */ `query ListVerdureTelemetryLogs(
  $filter: TableVerdureTelemetryLogsFilterInput
  $limit: Int
  $nextToken: String
) {
  listVerdureTelemetryLogs(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      data_type
      timestamp
      ph_levels
      temperature
      humidity
      light_level
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListVerdureTelemetryLogsQueryVariables,
  APITypes.ListVerdureTelemetryLogsQuery
>;

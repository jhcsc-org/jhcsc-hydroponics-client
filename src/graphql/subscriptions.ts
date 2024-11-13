/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateVerdureTelemetryLogs = /* GraphQL */ `subscription OnCreateVerdureTelemetryLogs(
  $data_type: String
  $timestamp: Int
  $ph_levels: [Float]
  $temperature: Float
  $humidity: Float
) {
  onCreateVerdureTelemetryLogs(
    data_type: $data_type
    timestamp: $timestamp
    ph_levels: $ph_levels
    temperature: $temperature
    humidity: $humidity
  ) {
    data_type
    timestamp
    ph_levels
    temperature
    humidity
    light_level
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateVerdureTelemetryLogsSubscriptionVariables,
  APITypes.OnCreateVerdureTelemetryLogsSubscription
>;
export const onUpdateVerdureTelemetryLogs = /* GraphQL */ `subscription OnUpdateVerdureTelemetryLogs(
  $data_type: String
  $timestamp: Int
  $ph_levels: [Float]
  $temperature: Float
  $humidity: Float
) {
  onUpdateVerdureTelemetryLogs(
    data_type: $data_type
    timestamp: $timestamp
    ph_levels: $ph_levels
    temperature: $temperature
    humidity: $humidity
  ) {
    data_type
    timestamp
    ph_levels
    temperature
    humidity
    light_level
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateVerdureTelemetryLogsSubscriptionVariables,
  APITypes.OnUpdateVerdureTelemetryLogsSubscription
>;
export const onDeleteVerdureTelemetryLogs = /* GraphQL */ `subscription OnDeleteVerdureTelemetryLogs(
  $data_type: String
  $timestamp: Int
  $ph_levels: [Float]
  $temperature: Float
  $humidity: Float
) {
  onDeleteVerdureTelemetryLogs(
    data_type: $data_type
    timestamp: $timestamp
    ph_levels: $ph_levels
    temperature: $temperature
    humidity: $humidity
  ) {
    data_type
    timestamp
    ph_levels
    temperature
    humidity
    light_level
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteVerdureTelemetryLogsSubscriptionVariables,
  APITypes.OnDeleteVerdureTelemetryLogsSubscription
>;

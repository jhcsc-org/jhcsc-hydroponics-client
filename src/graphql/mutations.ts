/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createVerdureTelemetryLogs = /* GraphQL */ `mutation CreateVerdureTelemetryLogs($input: CreateVerdureTelemetryLogsInput!) {
  createVerdureTelemetryLogs(input: $input) {
    data_type
    timestamp
    ph_levels
    temperature
    humidity
    light_level
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateVerdureTelemetryLogsMutationVariables,
  APITypes.CreateVerdureTelemetryLogsMutation
>;
export const updateVerdureTelemetryLogs = /* GraphQL */ `mutation UpdateVerdureTelemetryLogs($input: UpdateVerdureTelemetryLogsInput!) {
  updateVerdureTelemetryLogs(input: $input) {
    data_type
    timestamp
    ph_levels
    temperature
    humidity
    light_level
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateVerdureTelemetryLogsMutationVariables,
  APITypes.UpdateVerdureTelemetryLogsMutation
>;
export const deleteVerdureTelemetryLogs = /* GraphQL */ `mutation DeleteVerdureTelemetryLogs($input: DeleteVerdureTelemetryLogsInput!) {
  deleteVerdureTelemetryLogs(input: $input) {
    data_type
    timestamp
    ph_levels
    temperature
    humidity
    light_level
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteVerdureTelemetryLogsMutationVariables,
  APITypes.DeleteVerdureTelemetryLogsMutation
>;

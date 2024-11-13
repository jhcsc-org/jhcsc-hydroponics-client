/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateVerdureTelemetryLogsInput = {
  data_type: string,
  timestamp: number,
  ph_levels?: Array< number | null > | null,
  temperature?: number | null,
  humidity?: number | null,
  light_level?: number | null,
};

export type VerdureTelemetryLogs = {
  __typename: "VerdureTelemetryLogs",
  data_type: string,
  timestamp: number,
  ph_levels?: Array< number | null > | null,
  temperature?: number | null,
  humidity?: number | null,
  light_level?: number | null,
};

export type UpdateVerdureTelemetryLogsInput = {
  data_type: string,
  timestamp: number,
  ph_levels?: Array< number | null > | null,
  temperature?: number | null,
  humidity?: number | null,
  light_level?: number | null,
};

export type DeleteVerdureTelemetryLogsInput = {
  data_type: string,
  timestamp: number,
};

export type TableVerdureTelemetryLogsFilterInput = {
  data_type?: TableStringFilterInput | null,
  timestamp?: TableIntFilterInput | null,
  ph_levels?: TableFloatFilterInput | null,
  temperature?: TableFloatFilterInput | null,
  humidity?: TableFloatFilterInput | null,
  light_level?: TableFloatFilterInput | null,
};

export type TableStringFilterInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  size?: ModelSizeInput | null,
};

export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type TableIntFilterInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
};

export type TableFloatFilterInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
};

export type VerdureTelemetryLogsConnection = {
  __typename: "VerdureTelemetryLogsConnection",
  items?:  Array<VerdureTelemetryLogs | null > | null,
  nextToken?: string | null,
};

export type CreateVerdureTelemetryLogsMutationVariables = {
  input: CreateVerdureTelemetryLogsInput,
};

export type CreateVerdureTelemetryLogsMutation = {
  createVerdureTelemetryLogs?:  {
    __typename: "VerdureTelemetryLogs",
    data_type: string,
    timestamp: number,
    ph_levels?: Array< number | null > | null,
    temperature?: number | null,
    humidity?: number | null,
    light_level?: number | null,
  } | null,
};

export type UpdateVerdureTelemetryLogsMutationVariables = {
  input: UpdateVerdureTelemetryLogsInput,
};

export type UpdateVerdureTelemetryLogsMutation = {
  updateVerdureTelemetryLogs?:  {
    __typename: "VerdureTelemetryLogs",
    data_type: string,
    timestamp: number,
    ph_levels?: Array< number | null > | null,
    temperature?: number | null,
    humidity?: number | null,
    light_level?: number | null,
  } | null,
};

export type DeleteVerdureTelemetryLogsMutationVariables = {
  input: DeleteVerdureTelemetryLogsInput,
};

export type DeleteVerdureTelemetryLogsMutation = {
  deleteVerdureTelemetryLogs?:  {
    __typename: "VerdureTelemetryLogs",
    data_type: string,
    timestamp: number,
    ph_levels?: Array< number | null > | null,
    temperature?: number | null,
    humidity?: number | null,
    light_level?: number | null,
  } | null,
};

export type GetVerdureTelemetryLogsQueryVariables = {
  data_type: string,
  timestamp: number,
};

export type GetVerdureTelemetryLogsQuery = {
  getVerdureTelemetryLogs?:  {
    __typename: "VerdureTelemetryLogs",
    data_type: string,
    timestamp: number,
    ph_levels?: Array< number | null > | null,
    temperature?: number | null,
    humidity?: number | null,
    light_level?: number | null,
  } | null,
};

export type ListVerdureTelemetryLogsQueryVariables = {
  filter?: TableVerdureTelemetryLogsFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListVerdureTelemetryLogsQuery = {
  listVerdureTelemetryLogs?:  {
    __typename: "VerdureTelemetryLogsConnection",
    items?:  Array< {
      __typename: "VerdureTelemetryLogs",
      data_type: string,
      timestamp: number,
      ph_levels?: Array< number | null > | null,
      temperature?: number | null,
      humidity?: number | null,
      light_level?: number | null,
    } | null > | null,
    nextToken?: string | null,
  } | null,
};

export type OnCreateVerdureTelemetryLogsSubscriptionVariables = {
  data_type?: string | null,
  timestamp?: number | null,
  ph_levels?: Array< number | null > | null,
  temperature?: number | null,
  humidity?: number | null,
};

export type OnCreateVerdureTelemetryLogsSubscription = {
  onCreateVerdureTelemetryLogs?:  {
    __typename: "VerdureTelemetryLogs",
    data_type: string,
    timestamp: number,
    ph_levels?: Array< number | null > | null,
    temperature?: number | null,
    humidity?: number | null,
    light_level?: number | null,
  } | null,
};

export type OnUpdateVerdureTelemetryLogsSubscriptionVariables = {
  data_type?: string | null,
  timestamp?: number | null,
  ph_levels?: Array< number | null > | null,
  temperature?: number | null,
  humidity?: number | null,
};

export type OnUpdateVerdureTelemetryLogsSubscription = {
  onUpdateVerdureTelemetryLogs?:  {
    __typename: "VerdureTelemetryLogs",
    data_type: string,
    timestamp: number,
    ph_levels?: Array< number | null > | null,
    temperature?: number | null,
    humidity?: number | null,
    light_level?: number | null,
  } | null,
};

export type OnDeleteVerdureTelemetryLogsSubscriptionVariables = {
  data_type?: string | null,
  timestamp?: number | null,
  ph_levels?: Array< number | null > | null,
  temperature?: number | null,
  humidity?: number | null,
};

export type OnDeleteVerdureTelemetryLogsSubscription = {
  onDeleteVerdureTelemetryLogs?:  {
    __typename: "VerdureTelemetryLogs",
    data_type: string,
    timestamp: number,
    ph_levels?: Array< number | null > | null,
    temperature?: number | null,
    humidity?: number | null,
    light_level?: number | null,
  } | null,
};

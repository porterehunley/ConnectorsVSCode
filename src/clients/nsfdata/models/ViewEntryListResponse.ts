/* tslint:disable */
/* eslint-disable */
/**
 * NSF Data
 * NSF Data Connector provides access to any HCL Domino NSF database as well as IBM Domino NSF database (from version 9.0.1) for which Domino Access Services (DAS) are enabled. The Connector represents NSF databases, views, view entries, and documents in JSON format.
 *
 * The version of the OpenAPI document: 1.0
 * Contact: nsf.data@databoat.ch
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import {
    ViewEntry,
    ViewEntryFromJSON,
    ViewEntryFromJSONTyped,
    ViewEntryToJSON,
} from './';

/**
 * 
 * @export
 * @interface ViewEntryListResponse
 */
export interface ViewEntryListResponse extends Array<ViewEntry> {
}

export function ViewEntryListResponseFromJSON(json: any): ViewEntryListResponse {
    return ViewEntryListResponseFromJSONTyped(json, false);
}

export function ViewEntryListResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ViewEntryListResponse {
    return json;
}

export function ViewEntryListResponseToJSON(value?: ViewEntryListResponse | null): any {
    return value;
}


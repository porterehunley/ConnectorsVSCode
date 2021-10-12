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
    View,
    ViewFromJSON,
    ViewFromJSONTyped,
    ViewToJSON,
} from './';

/**
 * 
 * @export
 * @interface ViewListResponse
 */
export interface ViewListResponse extends Array<View> {
}

export function ViewListResponseFromJSON(json: any): ViewListResponse {
    return ViewListResponseFromJSONTyped(json, false);
}

export function ViewListResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ViewListResponse {
    return json;
}

export function ViewListResponseToJSON(value?: ViewListResponse | null): any {
    return value;
}



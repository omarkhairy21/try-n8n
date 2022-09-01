import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import axios from 'axios';

export class CdsReading implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cds Reading',
		name: 'CdsReading',
		group: ['Logs'],
		version: 1,
		description: '',
		defaults: {
			name: 'Conneo',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'Object ID',
				name: 'objectId',
				type: 'string',
				default: '',
				placeholder: 'Ex: 12212',
				description: 'Get Object Details form CDS by objectId',
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		let item: INodeExecutionData;
		let objectId: string;

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				item = items[itemIndex];
				const objectId = this.getNodeParameter('objectId', itemIndex, '') as string;
				console.log(objectId, item.json['objectId'])

				const data = await axios({
					method: 'post',
					url: 'https://s02.cloudbridge.nl/ConneoDataStore_ZR/CDS.dll/api/login?password=37d3ab37a60893cd180f6244b5600dd9&username=conneo',
				}).then(({ data: { response: { userid, sessionid }} }) => {
					console.log(userid, sessionid)
					return axios({
						method: 'get',
						url: `https://s02.cloudbridge.nl/ConneoDataStore_ZR/CDS.dll/api/getObject`,
						params: {
							userid,
							sessionid,
							objectid: item.json['objectId'],
							objecttype: '',
							relationdepth: '2',
							includeconfig: '0'
						}
					})
				}).then((response) => {
					const { data } = response
					console.log(response , data)
					returnData.push({
						json: data,
						pairedItem: {
							item: itemIndex,
						}
					})
					return data
				}).catch(
					(error) => {
						console.log(error)
					}
				)

			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}
		console.log('Data', returnData)
		return [returnData];
	}
}

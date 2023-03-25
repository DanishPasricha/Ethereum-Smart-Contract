/* eslint-disable quote-props */
/* eslint-disable quotes */
/* eslint-disable linebreak-style */
/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const { Contract, Context } = require('fabric-contract-api');
const PatientRecord = require('./patientrecord.js');
const PatientRecordList = require('./patientrecordlist.js');


class PatientRecordContext extends Context {

    constructor() {
        super();
        this.patientRecordList = new PatientRecordList(this);
    }

}
class PatientRecordContract extends Contract {

    constructor() {
        super('edu.asu.patientrecordcontract');
    }

    createContext() {
        return new PatientRecordContext();
    }

    async init(ctx) {
        console.log('Instantiated the patient record smart contract.');
    }
    async unknownTransaction(ctx){
        throw new Error("Function name missing")
    }

    async afterTransaction(ctx){
        console.log('---------------------INSIDE afterTransaction-----------------------')
        let func_and_params = ctx.stub.getFunctionAndParameters()
        console.log('---------------------func_and_params-----------------------')
        console.log(func_and_params)
        console.log(func_and_params['fcn'] === 'createPatientRecord' && func_and_params['params'][4]==='AB-')
        if (func_and_params['fcn'] === 'createPatientRecord' && func_and_params['params'][4]==='AB-') {
            ctx.stub.setEvent('rare-blood-type', JSON.stringify({'username': func_and_params.params[0]}))
            console.log('Chaincode event is being created!')
        }

    }
    async createPatientRecord(ctx,username,name,dob,gender,blood_type){
        let pRecord = PatientRecord.createInstance(username,name,dob,gender,blood_type);
        await ctx.patientRecordList.addPRecord(pRecord);
        return pRecord.toBuffer();
    }

    async getPatientByKey(ctx, username, name){
        let pRecordKey = PatientRecord.makeKey([username,name]);
        let pRecord = await ctx.patientRecordList.getPRecord(pRecordKey);
        return JSON.stringify(pRecord)
    }



    async updateCheckupDate(ctx,username,name,last_checkup_date){
        let pRecordKey = PatientRecord.makeKey([username, name]);
        let pRecord = await ctx.patientRecordList.getPRecord(pRecordKey);
        pRecord.set_last_checkup_date(last_checkup_date);
        await ctx.patientRecordList.updatePRecord(pRecord);
        return JSON.stringify(pRecord)
    }


    async queryWithQueryString(ctx, queryString) {
        console.log("query String");
        console.log(JSON.stringify(queryString));

        let resultsIterator = await ctx.stub.getQueryResult(queryString);

        let allResults = [];

        while (true) {
            let res = await resultsIterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};

                console.log(res.value.value.toString('utf8'));

                jsonRes.Key = res.value.key;

                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }

                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await resultsIterator.close();
                console.info(allResults);
                console.log(JSON.stringify(allResults));
                return JSON.stringify(allResults);
            }
        }

}
    async queryByGender(ctx, gender) {
        let query_string_1 = {"selector" : {"gender": gender},"use_index": ["_design/genderIndexDoc", "genderIndex"]};
        let records_list_1 = await this.queryWithQueryString(ctx, JSON.stringify(query_string_1));
        return records_list_1;
    }
    async queryByBlood_Type(ctx, bloodtype_1){
        let query_string_2 = {"selector" : {"blood_type": bloodtype_1},"use_index": ["_design/blood_typeIndexDoc", "blood_typeIndex"]};
        let records_list_2 = await this.queryWithQueryString(ctx, JSON.stringify(query_string_2));
        return records_list_2;
    }
    async queryByBlood_Type_Dual(ctx, blood_type1, blood_type2) {
        let query_String_3 = {"selector": {"blood_type": {"$in": [blood_type1,blood_type2]}},"use_index": ["_design/IndexDoc",
                "blood_typeIndex"]};
        let ans = await this.queryWithQueryString(ctx, JSON.stringify(query_String_3));
        return ans;
    }
}


module.exports = PatientRecordContract;

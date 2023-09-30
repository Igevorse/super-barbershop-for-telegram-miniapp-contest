import * as $ from 'jquery';

type Dict = { [name: string]: any};

export class YClientAPI {
    headers: { [name: string]: any};
    lang: string;
    bookform: { [name: string]: any};
    userData: { [name: string]: any};
    strings: { [name: string]: any};
    specialistsList:  { [name: string]: any}[] = [];
    servicesList:  { [name: string]: any} = {};
    generalInfo:  { [name: string]: any} = {};
    servicesById: { [name: string]: any} = {};

    userToken: string = "";
    selectedServices: number[] = [];
    specialistId: number = 0;
    selectedDateTime: string = "";

    constructor(private partnerToken: string, private company_id: number, language: string = 'en-US') {
        this.headers = {
            "Accept": "application/vnd.yclients.v2+json",
            'Accept-Language': language,
            'Authorization': `Bearer ${partnerToken}`,
            // 'Cache-Control': "no-cache",
            // 'Access-Control-Allow-Headers': '*',
        }
    }

    private getHeaders(userToken: string = "") {
        console.log('getHeaders(), arg token: ', userToken, ', is signed in: ', this.isSignedIn(), this.userToken)
        if (userToken !== null && userToken !== undefined && userToken !== "") {
            this.headers['Accept'] = `Bearer ${this.partnerToken}, User ${userToken}`;
            console.log('Got user token!')
        }
        else if (this.isSignedIn()) {
            console.log('Has user token!')
            this.headers['Accept'] = `Bearer ${this.partnerToken}, User ${this.userToken}`;
        }
        else {
            this.headers['Accept'] = `Bearer ${this.partnerToken}`;
        }
        return this.headers;
    }

    private async getRequest(url:string, data: any, async: boolean = true, userToken: string = "") {
        // const userAuth = (this.userToken !== null && this.userToken !== undefined && this.userToken !== "") ? `, User ${this.userToken}` : '';
        const headers = {
            'Authorization': `Bearer ${this.partnerToken}`,
            'Accept': 'application/vnd.yclients.v2+json'
        }
        if (this.isSignedIn()) {
            headers['Authorization'] += ', User ' + this.userToken;
        }

        return $.ajax({
            url: url,
            type: 'get',
            async: async,
            data: data,
            headers: headers,
            dataType: 'json',
        });
    }

    private async postRequest(url:string, data: any, async: boolean = true) {
        return $.ajax({
            url: url,
            type: 'post',
            async: async,
            data: data,
            headers: this.getHeaders(),
            dataType: 'json',
        });
    }

    async getUserData(userToken: string) {
        const url = `https://api.yclients.com/api/v1/booking/user/data`;
        const headers = {
            "Authorization": `Bearer ${this.partnerToken}, User ${userToken}`,
            "Accept": "application/vnd.yclients.v2+json",
        }

        try {
            const {data} = await $.ajax({
                url: url,
                type: 'get',
                async: false,
                data: null,
                headers: headers,
                dataType: 'json',
            });
            this.userData = data;
            this.userToken = data.user_token;
            console.log('GOT USER DATA: ', data)
            // TODO: Put token into Telegram kv-storage
        }
        catch(err) {
            console.log('getUserData(): cannot access server')
            this.userData = {};
            this.userToken = "";
            // TODO: Remove token fro kv-storage
        }
    }

    getErrorMessages(err: any) {
        let errors = (err.responseJSON.errors) ? err.responseJSON.errors : err.responseJSON.meta;
        if(!Array.isArray(errors)) {
            errors = [errors];
        }
        return errors;
    }

    isReadyToOrder() {
        return (this.selectedDateTime != "") && (this.selectedServices.length > 0) && (this.specialistId > -1)
    }

    addService(serviceId: number) {
        this.selectedServices.push(serviceId);
    }

    removeService(serviceId: number) {
        this.selectedServices = this.selectedServices.filter(item => item !== serviceId);
    }

    chooseSpecialist(specialistId: number) {
        this.specialistId = specialistId;
    }

    chooseDateTime(dateTime: string) {
        this.selectedDateTime = dateTime;
    }

    isSignedIn() {
        return this.userToken !== "" && Object.keys(this.userData).length > 0;
    }

    async getMyOrders() {
        if (!this.isSignedIn()) {
            console.log('getMyOrders(): not signed in');
            return;
        }
        const url = `https://b83773.yclients.com/api/v1/user/records/?company_id=${this.company_id}`;

        try {
            const {data} = await this.getRequest(url, null, false);
            return data;
        }
        catch(err) {
            console.log('getMyOrders(): cannot access server', err)
            throw err;
        }
    }


    async confirmOrder(phone: string = "", name: string = "", email: string = "", comment: string = "") {
        const url = `https://api.yclients.com/api/v1/book_record/${this.company_id}`;
        const orderData = {
            phone: phone,
            fullname: name,
            email: email,
            comment: comment,
            appointments: [
                {
                    id: 0,
                    services: this.selectedServices,
                    staff_id: this.specialistId,
                    datetime: this.selectedDateTime,

                }
            ]
        };
        try {
            const data = await this.postRequest(url, orderData, false);
            const isSuccess = data.success;
            const records = data.data;
        }
        catch(err) {
            console.log('confirmOrder(): cannot access server', err)
            throw err;
        }
    }

    async getTokenUsingCode(phone: string, code: string) {
        const url = "https://b83773.yclients.com/api/v1/user/auth";
        try {
            const {data} = await this.postRequest(url, {phone: phone, code: code, company_id: this.company_id}, false);
            this.userData = data;
            this.userToken = data.token;
            // TODO: Put token into Telegram kv-storage
        }
        catch(err) {
            // popup: cannot access server
            // this.close()
            console.log('getTokenUsingCode(): cannot access server')
            throw err;
        }
    }

    async getLanguageData(lang: string) {
        this.lang = lang;
        this.headers['Accept-Language'] = lang;

        const url = `https://b83773.yclients.com/api/v1/i18n/${lang}`;

        try {
            const data = await this.getRequest(url, null, false);
            console.log('Got languages!', data)
            this.strings = data;
        }
        catch(err) {
            // popup: cannot access server
            // this.close()
            console.log('Cannot access server')
        }
    }

    async loadCompanyData() {
        // TODO: Read token from kv-storage
        // const userToken = '761f6e1d4dad31a32383f121f5ba41e5';
        await this.getUserData(this.userToken);
        await this.loadBookForm();
        await this.getLanguageData('en-US');
        await this.loadGeneralInfo();
        await this.loadServices();
        await this.loadSpecialists();
    }

    async loadBookForm() {
        const url = `https://b83773.yclients.com/api/v1/bookform/83773/`;

        try {
            const {data} = await this.getRequest(url, null, false);
            this.bookform = data;
        }
        catch(err) {
            // popup: cannot access server
            // this.close()
            console.log('cannot access server')
        }
    }

    async loadServices() {
        const url = 'https://b83773.yclients.com/api/v1/book_services/98256?staff_id=&datetime=';

        try {
            const {data} = await this.getRequest(url, null, false);
            this.servicesList = data;
            for (const s of this.servicesList.services) {
                this.servicesById[s.id] = s;
            }
        }
        catch(err) {
            // popup: cannot access server
            // this.close()
            console.log('loadServices(): cannot access server', err)
        }
    }

    async loadSpecialists() {
        const url = 'https://b83773.yclients.com/api/v1/book_staff/98256?datetime=&without_seances=1';

        try {
            const {data} = await this.getRequest(url, null, false);
            console.log('SPecialists loaded:', data)
            this.specialistsList = data;
        }
        catch(err) {
            // popup: cannot access server
            // this.close()
            console.log('loadSpecialists(): cannot access server')
        }
    }

    async loadGeneralInfo() {
        const url = 'https://b83773.yclients.com/api/v1/company/98256?forBooking=1&bookform_id=83773';

        try {
            const {data} = await this.getRequest(url, null, false);
            this.generalInfo = data;
        }
        catch(err) {
            // popup: cannot access server
            // this.close()
            console.log('loadGeneralInfo(): cannot access server')
        }
    }

    async requestVerificationCode(phone: string) {
        const url = `https://b83773.yclients.com/api/v1/book_code/${this.company_id}/channel`;

        try {
            return await this.getRequest(url, {phone: phone}, true);
        }
        catch(err) {
            // popup: cannot access server
            // this.close()
            console.log('requestVerificationCode(): cannot access server')
            throw err
        }
    }

    getUserToken(login: string, password: string): string {
        const url = "https://api.yclients.com/api/v1/auth";
        const data = {
            "login": login,
            "password": password
        }

        const result = $.ajax({
            url: url,
            type: 'post',
            data: data,
            headers: this.getHeaders(),
            dataType: 'json',
            success: function (data: any) {
                console.info(data);
            }
        });

        return ''
        // response = httpx.post(url, headers=self.headers, params=querystring)
        // user_token = ujson.loads(response.text)['data']['user_token']
        // if self.__show_debugging:
        //     print(f"Obtained user token {user_token}")
        // return user_token
    }

    async getAvailableStaff(): Promise<Dict[]> {
        const url = `https://api.yclients.com/api/v1/book_staff/${this.company_id}`;

        const payload: Dict = {};
        if (this.selectedDateTime != "") {
            payload['datetime'] = this.selectedDateTime;
        }
        if(this.selectedServices.length > 0) {
            payload['service_ids'] = this.selectedServices;
        }
        try {
            const {data} = await this.getRequest(url, payload, true);
            return data;
        }
        catch(err) {
            // popup: cannot access server
            // this.close()
            console.log('getAvailableStaff(): cannot access server')
        }
    }

    async getAvailableServices(staffId: number = 0): Promise<Dict> {
        const url = `https://api.yclients.com/api/v1/book_services/${this.company_id}`;

        const payload: Dict = {
            staff_id: staffId,
        };
        if(this.selectedDateTime != "") {
            payload['datetime'] = this.selectedDateTime.slice(0, 19);
        }
        try {
            const {data} = await this.getRequest(url, payload, true);
            return data;
        }
        catch(err) {
            // popup: cannot access server
            // this.close()
            console.log('getAvailableServices(): cannot access server')
        }
    }

    async getAvailableDates() {
        const url = `https://api.yclients.com/api/v1/book_dates/${this.company_id}`;

        const payload: Dict = {
            staff_id: this.specialistId,
            service_ids: this.selectedServices,
            date_from: new Date().toISOString().slice(0,10)
        };

        try {
            const {data} = await this.getRequest(url, payload, true);
            return data;
        }
        catch(err) {
            // popup: cannot access server
            // this.close()
            console.log('getAvailableDates(): cannot access server')
        }
    }

    async getAvailableTimes(date: string): Promise<Dict[]> {
        // date: iso8601: 'YYYY-MM-DD'
        const url = `https://api.yclients.com/api/v1/book_times/${this.company_id}/${this.specialistId}/${date}`;

        const payload: Dict = {};
        
        if (this.selectedServices.length > 0){
            payload['service_ids'] = this.selectedServices;
        };

        try {
            const {data} = await this.getRequest(url, payload, true);
            console.log(data);
            return data;
        }
        catch(err) {
            // popup: cannot access server
            // this.close()
            console.log('getAvailableDates(): cannot access server')
        }
    }
}
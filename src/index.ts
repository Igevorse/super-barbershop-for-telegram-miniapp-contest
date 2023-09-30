import * as $ from "jquery";
import {YClientAPI} from "./yclients_api";

const tg = Telegram.WebApp;
const mainButton = Telegram.WebApp.MainButton;
const backButton = tg.BackButton;

tg.enableClosingConfirmation();

backButton.hide();
mainButton.hide();


const client = new YClientAPI("udk9frnase2ufrtjb8cf", 98256);

function displayNoneInline(id: string) {
    const el = $('#' + id);
    el.removeClass('display-none');
    el.addClass('display-inline');
}

function displayInline(id: string) {
    const el = $('#' + id);
    el.removeClass('display-none');
    el.addClass('display-inline');
}

function displayNone(id: string) {
    const el = $('#' + id);
    el.removeClass('display_block');
    el.addClass('display-none');
}

function displayBlock(id: string) {
    const el = $('#' + id);
    el.removeClass('display-none');
    el.addClass('display_block');
}

function hide(id: string) {
    const el = $('#' + id);
    el.removeClass('visible');
    el.addClass('hidden');

    setTimeout(function() { displayNone(id) }, 330);
}

function show(id: string) {
    const el = $('#' + id);
    el.removeClass('hidden');
    el.addClass('visible');

    setTimeout(function() { displayBlock(id) }, 330);
}

function showInline(id: string) {
    const el = $('#' + id);
    el.removeClass('hidden');
    el.addClass('visible');

    setTimeout(function() { displayInline(id) }, 330);
}

interface ViewConstructorArgs {
    section_id: string;
    previousView: View;
    showMainButton: boolean;
    mainButtonText: string;
    showBackButton: boolean;
    mainButtonCallback: any;
}

type Callback = () => void;

class View {
    backCallback = function() { this.back() }.bind(this);
    previousView: View | null;
    showMainButton: boolean;
    showBackButton: boolean;
    mainButtonText: string | null;
    mainButtonCallback: Callback;

    constructor(private readonly section_id: string, showBackButton: boolean = false,
                showMainButton: boolean = false, mainButtonText: string = null,
                mainButtonCallback: Callback = null) {
        this.showBackButton = showBackButton || false;
        this.showMainButton = showMainButton || false;
        this.mainButtonCallback = mainButtonCallback;
        this.mainButtonText = mainButtonText;
    }

    updateMainMenu(show: boolean, text: string = "", callback: Callback = null ) {
        this.showMainButton = show;
        this.mainButtonCallback = callback;
        this.mainButtonText = text;
    }

    back() {
        this.close();
        if (this.previousView)
            this.previousView.open();
        this.previousView = null;
    }

    launch(view: View) {
        this.close();
        view.previousView = this;
        view.open();
    }

    open() {
        show(this.section_id);
        if(this.showBackButton) {
            backButton.show();
            backButton.onClick(this.backCallback);
        }

        if (this.showMainButton) {
            mainButton.setText(this.mainButtonText);
            mainButton.onClick(this.mainButtonCallback);
            mainButton.show();
        }
        else {
            mainButton.hide()
        }
    }

    close() {
        hide(this.section_id);
        if (this.showBackButton) {
            backButton.hide();
            backButton.offClick(this.backCallback);
        }

        if (this.showMainButton) {
            mainButton.hide()
            mainButton.offClick(this.mainButtonCallback);
        }
    }
}

const languageSelectionView = new View("language_selection");
const authMethodSelectionView = new View("auth_method_selection", true);
const authByCodeSelectionView = new View("auth_by_code", true, true, 'Confirm', codeAuthViewMainButtonClick);
const authByPasswordSelectionView = new View("auth_by_password", true, true, '', signInUsingPassword);

const mainView = new View("main", false, false);
const chooseServicesView = new View("services", false, false);
const chooseSpecialistView = new View("specialists", true, false);
const chooseDatetimeView = new View("datetime", true, true, "Choose");

const orderFormView = new View("order-form", true, true, 'Order');
const myOrdersView = new View("my-orders", true, false);

function signInUsingPassword() {
    // It works, but why spend money for SMS?
    tg.showAlert("That's all for now!");
}

function prepareMainView(open: boolean = false) {

    $('#main > h2').text(client.generalInfo.title);
    $('.company-logo').attr('src', client.generalInfo.logo);

    $('#select_specialist_button').val(client.strings.steps.select_staff);
    $('#select_datetime_button').val(client.strings.steps.select_date_time);
    $('#select_services_button').val(client.strings.steps.select_services);

    $('#change_language_link').text(client.strings.menu.change_lang);
    const isSigned = client.isSignedIn();
    if (client.isSignedIn()) {
        $('#log_out_link').text(client.strings.menu.logout);
        displayBlock('log_out_link');
        displayNone('log_in_link');
    }
    else {
        $('#log_in_link').text(client.strings.menu.login);
        displayBlock('log_in_link');
        displayNone('log_out_link');
    }

    if(client.isReadyToOrder()) {
        mainView.updateMainMenu(true, client.strings.confirm.confirm, showOrderForm)
    }
    else {
        mainView.updateMainMenu(false)
    }

    if (client.specialistId > 0) {
        $('#select_specialist_button').addClass('specialist-is-chosen');
        $('#main-specialist-info').addClass('main-specialist-info');
        $('#main-specialist-wrapper').show();

        for (const sp of client.specialistsList) {
            if (client.specialistId !== sp.id) {
                continue;
            }
            $('#main-specialist-image').attr('src', sp.avatar);
            $('#main-specialist-name').text(sp.name);
            break;
        }
    }
    else {
        $('#select_specialist_button').removeClass('specialist-is-chosen');
        $('#main-specialist-info').removeClass('main-specialist-info');
        $('#main-specialist-wrapper').hide();
    }

    if (client.selectedDateTime !== "") {
        $('#main-datetime-info').addClass('main-specialist-info');
        $('#main-datetime-wrapper').html(client.selectedDateTime.replace('T', ' '));
        $('#main-datetime-wrapper').show();
        $('#select_datetime_button').addClass('specialist-is-chosen');
        $('#main-datetime_button').val('Change date and time');
    }
    else {
        $('#main-datetime-info').removeClass('main-specialist-info');
        $('#main-datetime-wrapper').hide();
        $('#select_datetime_button').removeClass('specialist-is-chosen');
        $('#main-datetime_button').val('Choose date and time');
    }

    if (client.selectedServices.length > 0) {
        $('#main-service-info').addClass('main-specialist-info');
        const services = client.selectedServices.map(id => client.servicesById[id].title).join(', ');
        $('#main-service-wrapper').html(services);
        $('#main-service-wrapper').show();
        $('#select_services_button').addClass('specialist-is-chosen');
        $('#main-service_button').val('Change date and time');
    }
    else {
        $('#main-service-info').removeClass('main-specialist-info');
        $('#select_services_button').removeClass('specialist-is-chosen');
        $('#main-service-wrapper').hide();
        $('#main-service_button').val('Choose date and time');
    }

    if (open) {
        mainView.open()
    }
}

function confirmOrder() {
    // It works, but why spend money for SMS?
    tg.showAlert("That's all for now!");
    return;

    const name = $('#book-name').val() as string;
    const phone = $('#book-phone').val() as string;
    const email = $('#book-email').val() as string;
    const comment = $('#book-comment').val() as string;

    if(name.length === 0) {
        tg.showAlert(client.strings.errors.name.required);
        return;
    }
    if(phone.length === 0) {
        tg.showAlert(client.strings.errors.phone.required);
        return;
    }
    const xhr = client.confirmOrder(phone, name, email, comment);
    xhr.then((data) => {
        // Goto my orders
        myOrdersView.showBackButton = false;
        showMyOrdersView(orderFormView);

    }, (err) => {
        // Rejected
        let errors = err.responseJSON.errors;
        if(!Array.isArray(errors)) {
            errors = [errors];
        }
        $('#order-errors').empty();
        for (const e of errors) {
            $('#order-errors').append(`<p>${e.message}</p>`);
        }
    })
}

function showOrderForm() {
    $('#book-name-label').text(client.strings.confirm.first_name + ' *');
    $('#book-phone-label').text(client.strings.confirm.phone + ' *');
    $('#book-email-label').text(client.strings.confirm.email);
    $('#book-comment-label').text(client.strings.confirm.comment);
    $("#confirm-order-title").text(client.strings.record.record);
    $("#order-details-title").text(client.strings.confirm.booking_details);

    $('#book-name').attr("placeholder", client.strings["user-data-form"].terms.name);
    $('#book-phone').attr("placeholder", client.strings["user-data-form"].terms.phone);
    $('#book-email').attr("placeholder", client.strings["user-data-form"].terms.email);
    $('#book-comment').attr("placeholder", client.strings["user-data-form"].terms.comment);

    const specialistData = client.specialistsList.filter(s => s.id == client.specialistId)[0];
    const serviceNames = [];
    for (const id of client.selectedServices) {
        serviceNames.push(client.servicesById[id].title);
    }
    const services = serviceNames.join(', ');

    $("#order-barber-info > img").attr("src", specialistData.avatar);
    $("#order-barber-info > div").text(specialistData.name);

    $("#order-service-info-span").text(services);
    $("#order-datetime-info").text(client.selectedDateTime.replace('T', ' '));

    orderFormView.updateMainMenu(true, client.strings.button.confirm, confirmOrder)

    const isSignedIn = client.userToken !== "" && Object.keys(client.userData).length > 0;
    if (isSignedIn) {
        $('#book-name').val(client.userData.name);
        $('#book-phone').val(client.userData.phone);
        $('#book-email').val(client.userData.email);
    }
    mainView.launch(orderFormView);
}

function showMyOrdersView(view: View, showBackButton: boolean = true, showMainButton: boolean = false, mainButtonText: string = "", mainButtonCallback: Callback = null) {
    client.getMyOrders().then((data) => {

        $("#my-orders-title").text(client.strings.header.my_records);
        const wrapper = $('#my-orders-wrapper');
        wrapper.empty();

        for (const o of data.reverse()) {
            const services = o.services.map((s: any) => s.title).join(', ')
            const staff_name = o.staff.name;
            const staff_avatar = o.staff.avatar;
            const date = o.date;
            const comment = o.comment;
            const html = `
            <div class="rounded-div">
                <div id="order-barber-info">
                    <img class="specialist-image" style="vertical-align:middle" src="${staff_avatar}">

                    <div class="large-font">${staff_name}</div>
                </div>
                <div id="order-services-info">
                    <div id="order-service-info-span" class="large-font">${services}</div>

                    <div id="order-datetime-info" class="large-font">${date.replace('T', ' ')}</div>
                    <div class="large-font">${comment}</div>
                </div>
            </div>`;
            wrapper.append(html);
        }

        myOrdersView.showBackButton = showBackButton;
        myOrdersView.showMainButton = showMainButton;
        myOrdersView.mainButtonCallback = mainButtonCallback;
        myOrdersView.mainButtonText = mainButtonText;

        view.launch(myOrdersView);
    });
}

function showServicesView() {
    client.getAvailableServices(client.specialistId).then((availableServices) => {
 
        const groups: {[name:string]: any} = {};

        for (const group of availableServices.category) {
            groups[group.id] = [];
        }

        for (const s of availableServices.services) {
            if (!s.active) {
                continue;
            }
            groups[s.category_id] = groups[s.category_id] || [];
            groups[s.category_id].push(s);
        }

        const wrapper = $('#service_groups_list');
        wrapper.empty();

        for (const group of availableServices.category) {
            wrapper.append(`
                <div id="service-group-${group.id}" class="service-group">
                    <h3>${group.title}</h3>
                </div>
            `);
            const groupDiv = $(`#service-group-${group.id}`);
            for (const service of groups[group.id]) {
                const isSelected = client.selectedServices.indexOf(service.id) !== -1;
                const cls = isSelected ? 'selected-service' : '';
                const value = isSelected ? client.strings.button['remove-from-record'] : client.strings.service.add;
                const color = isSelected ? 'red-btn' : 'telegram-color';

                groupDiv.append(`
                    <div class="service ${cls}">
                        <img class="service_image" src="${service.image}">
                        <h2 class="service_name">${service.title}</h2>
                        <span class="service_description">${service.comment || ''}</span>
                        <br/>
                        <input type="button" class="btn ${color} full-width add-service-button" value="${value}" data-service-id="${service.id}"/>
                    </div>
                `);
            }
        }

        $("#services > h2").text(client.strings.header.select_service);
  
        chooseServicesView.updateMainMenu(true, client.strings.button.continue, saveServices)
        addStaticEventListeners();
        mainView.launch(chooseServicesView);
    });
}

function showSpecialistsView() {
    client.getAvailableStaff().then((availableStaff) => {
        const wrapper = $('#specialists-list-wrapper');

        wrapper.empty()
        for (const sp of availableStaff) {
            if (!sp.bookable) {
                continue;
            }
            const isSelected = (client.specialistId == sp.id) ? ' selected-specialist ' : '';
            const html = `\
                <div class="specialist ${isSelected}">\
                <img class="specialist_image" src="${sp.avatar}">\
                <h2 class="specialist_name">${sp.name || ''}</h2>\
                ${sp.position.title || ''}
                <br/>\
                <input type="button" class="btn telegram-color full-width choose-specialist-button" value="Choose}" data-specialist-id="${sp.id}"/>\
            </div>`;
            
            wrapper.append(html);
        }

        $("#specialists > h2").text(client.strings.header.select_master);
        $(".choose-specialist-button").val(client.strings.button.select);

        addStaticEventListeners();
        mainView.launch(chooseSpecialistView);
    });
}

function redrawAvailableTime(date: string) {
    client.getAvailableTimes(date).then((availableTime) => {
        const wrapper = $('#time-select');
        const msg = $("#no-slots-message");
        msg.empty();

        if (availableTime.length == 0) {
            msg.text('No free slots in this date!');
        }
        msg.toggleClass('display-none', availableTime.length !== 0)
        msg.toggleClass('display_block', availableTime.length === 0)
        wrapper.empty();
        for(const t of availableTime) {
            wrapper.append(`<option value="${t.datetime}">${t.time}</option>`);
        }

        wrapper.on('change', function(e) {
            saveDateTime();
        });
    });

}

function showDateTimeView() {
    client.getAvailableDates().then((availableDates) => {
        let isoDates = availableDates.working_dates.map((d: number) => { 
            return d;
        });
    
        const wrapper = $('#date-select');
        wrapper.empty();
        for(const date of isoDates) {
            wrapper.append(`<option value="${date}">${date}</option>`);
        }
        wrapper.val(isoDates[0]);

        wrapper.on('change', function(e) {
            redrawAvailableTime($(this).val() as string)

        });

        $('#datetime > h2').text(client.strings.header.select_datetime_menu);

        chooseDatetimeView.updateMainMenu(true, client.strings.steps.select_date_time, saveDateTime);
        wrapper.trigger("change");
        mainView.launch(chooseDatetimeView);
    });
}

function saveSpecialist(e: any) {
    const el = $(e.target);
    const specialistId = el.data('specialist-id');

    client.chooseSpecialist(specialistId);
    prepareMainView();
    chooseSpecialistView.back();
}

function saveServices() {
    prepareMainView();
    chooseServicesView.back();
}

function saveDateTime() {
    const dateTime = $('#time-select').val() as string;

    client.chooseDateTime(dateTime);
    prepareMainView();
    chooseDatetimeView.back();
}

function codeAuthConfirmed(data: any) {
    client.userToken = data.user_token;
    client.getUserData(client.userToken).then(e => {

        prepareMainView();
        mainView.showBackButton = false;
        authByCodeSelectionView.launch(mainView);
    });
}

function codeAuthFailed(e: any) {
    const message = client.getErrorMessages(e).join('\n');
    tg.showAlert(message);
}

function codeAuthViewMainButtonClick() {
    $('#code-auth-error').empty();
    const phoneNumber = $('#phone_number1').val() as string;
    $('#phone_number1').prop('disabled', true);

    // It works, but why spend money for SMS?
    tg.showAlert("That's all for now!");
    
    return;

    client.requestVerificationCode(phoneNumber).then(() => {
        showInline("auth_code");
        $('#auth_by_code > h2').html(client.strings.login.input_code_confirm);
        
        $("#auth_code").on("keyup", () => {
            let val = $('#auth_code').val() as string;
            if(val.toString().length == 4) {
                client.getTokenUsingCode(phoneNumber, val).then(codeAuthConfirmed, codeAuthFailed);
            }
        });   
    },
    // Failure
    (err) => {
        let errors = (err.responseJSON.errors) ? err.responseJSON.errors : err.responseJSON.meta;
        if(!Array.isArray(errors)) {
            errors = [errors];
        }
        const wrapper = $('#code-auth-error');
        wrapper.empty();
        for (const e of errors) {
            wrapper.append(`<p>${e.message}</p>`);
        }
    });
}

function showCodeAuthView() {
    $('#phone_number1').prop('disabled', false);
    $('#code-auth-error').empty();
    authByCodeSelectionView.updateMainMenu(true, client.strings.login.get_code, codeAuthViewMainButtonClick)
    authMethodSelectionView.launch(authByCodeSelectionView);
}

function showAuthMethodView() {
    $('#auth_by_code > h2').html(client.strings.login.input_phone_num_1);
    $('#code_selection_button').val(client.strings.login.code_auth);
    $('#password_selection_button').val(client.strings.login.pass_auth);
    mainView.launch(authMethodSelectionView);
}

function showLanguageSelectionView() {
    const languages = client.bookform.langs;
    const section = $('#language_selection > div');

    section.empty();
    for(const lang of languages) {
        section.append(`<input type="button"value="${lang.title}" class="btn telegram-color " data-lang="${lang.code}" data-id="${lang.id}">`);
    }

    $("#language_selection > div > input").on("click", function(e) {
        const lang = $(this).data("lang");
        client.getLanguageData(lang).then((e) => { prepareMainView(); languageSelectionView.back(); })
    });

    mainView.launch(languageSelectionView);
}

function addStaticEventListeners() {
    $('#select_specialist_button').on("click", showSpecialistsView);
    $('#select_services_button').on("click", showServicesView);
    $('#select_datetime_button').on("click", showDateTimeView);
    $('#change_language_link').on("click", showLanguageSelectionView);

    $('.choose-specialist-button').on("click", saveSpecialist);

    $("#code_selection_button").on("click", showCodeAuthView);

    $("#password_selection_button").on("click", function(e) {
        authByPasswordSelectionView.mainButtonText = client.strings.menu.login;
        authMethodSelectionView.launch(authByPasswordSelectionView);
    });

    $('.add-service-button').on("click", (e) => {
        const el = $(e.target);
        const isRed = el.hasClass('red-btn');
        const serviceId = el.data('service-id');

        if (isRed) {
            el.val(client.strings.service.add);
            client.removeService(serviceId);
        }
        else {
            el.val(client.strings.button['remove-from-record']);
            client.addService(serviceId);
        }

        el.toggleClass("telegram-color", isRed);
        el.toggleClass("red-btn", !isRed);
    });

    $("#log_in_link").on("click", showAuthMethodView);

}

addStaticEventListeners();

client.loadCompanyData().then(() => {
    prepareMainView(true);
})

/**
 *
 * Custom Forms 4.2.0
 * Валидация форм
 *
 * Copyright 2025 Mihail Pridannikov
 *
 * Released on: January 21, 2026
 *
 */

const CustomForm = function (customSettings) {
    this.deepMergeObjects = function (obj1, obj2) {
        const result = {};
        for (const key in obj2) {
            if (obj2.hasOwnProperty(key)) {
                if (typeof obj2[key] === "object" && obj1.hasOwnProperty(key) && typeof obj1[key] === "object") {
                    result[key] = this.deepMergeObjects(obj1[key], obj2[key]);
                } else {
                    result[key] = obj2[key];
                }
            }
        }
        for (const key in obj1) {
            if (obj1.hasOwnProperty(key) && !result.hasOwnProperty(key)) {
                if (typeof obj1[key] === "object") {
                    result[key] = this.deepMergeObjects(obj1[key], {});
                } else {
                    result[key] = obj1[key];
                }
            }
        }
        return result;
    }

    const FORM = document.querySelectorAll('form');
    let elemGroupFieldIcon = null;

    let errors = false;

    const DEFAULT_SETTINGS = {
        setAsteriskOnLabels: true,
        blockedButtonSubmit: true,
        captcha: {
            active: 'yandex',
            google: {
                key: '',
            },
        },
        fields: {
            default: {
                messages: {
                    empty: "Поле обязательно для заполнения",
                    error: 'Поле заполнено некорректно',
                }
            },
            phone: {
                mask: true
            },
            email: {
                messages: {
                    characterType: 'Почта может содержать только латинские буквы, цифры, подчёркивание или дефис.',
                }
            },
            login: {
                min: 3,
                max: 16,
                messages: {
                    length: "Логин должен содержать от 3 до 16 символов.",
                    characterType: 'Логин может содержать только латинские буквы, цифры, подчёркивание или дефис.',
                }
            },
            password: {
                min: 6,
                max: 10,
                messages: {
                    length: "Пароль должен содержать от 6 до 10 символов.",
                    characterType: 'Пароль должен содержать: \n- заглавные и строчные буквы, \n- цифры, \n- специальные символы (!@#$%^& и др.).',
                }
            },
            passwordConfirm: {
                messages: {
                    mismatch: "Введённые пароли не совпадают",
                    empty: "Повторите ввод пароля",
                }
            },
            inn: {
                min: 6,
                max: 10,
                messages: {
                    length: "ИНН должен состоять из 10 или 12 символов",
                    characterType: 'Пароль должен содержать: \n- заглавные и строчные буквы, \n- цифры, \n- специальные символы (!@#$%^& и др.).',
                }
            },
            ogrn: {
                messages: {
                    length: "ОГРН должен состоять из 13 символов",
                }
            },
            ogrnip: {
                messages: {
                    length: "ОГРНИП должен состоять из 15 символов",
                }
            },
            kpp: {
                messages: {
                    length: "КПП должен состоять из 9 символов",
                }
            },
            bik: {
                messages: {
                    length: "БИК должен состоять из 9 символов",
                }
            },
            paymentAccount: {
                messages: {
                    length: "Расчетный счет должен состоять из 20 символов",
                }
            },
            comment: {
                displayNumberCharacterEntered: false,
                displayLimitNumberCharacterEntered: false,
                max: 150,
            }
        },
        popups: {
            classSuccessful: 'popup-success',
            classError: 'popup-error',
            classOpened: 'is-opened'
        },
        forms: {
            default: {
                ajax: 'ajax/form.php',
                blockingSendButton: false
            },
        },
    }

    let settings = this.deepMergeObjects(DEFAULT_SETTINGS, customSettings);

    let formData = {};

    this.init = function () {
        FORM.forEach(form => {
            if (form) {
                const idForm = form.getAttribute('data-form-id');

                // блокируем кнопку отправить если поля не заполнены
                if (settings.forms[idForm] && Object.prototype.hasOwnProperty.call(settings.forms[idForm], 'blockingSendButton') ? settings.forms[idForm].blockingSendButton : settings.forms.default.blockingSendButton) {
                    this.setBlockedButtonSubmit(form);
                }

                // добавляем событие на кнопку отправить
                form.addEventListener('submit', e => this.handlerOnSubmitForm(e, form));

                // пробегаемся по полям:
                // 1. добавляем класс "is-focused" при установки курсора и введенного текста
                // 2. добавляем события "focus", "blur", "input"
                // 3. применяем стилизацию для поля "file"
                // 4. устанавливаем "*" в лейбле поля и в плейсхолдере
                form.querySelectorAll('.form__field').forEach(field => {
                    let element = field.querySelector("input, textarea");

                    this.addingCharacterDisplay(field);
                    this.addMasked(element);

                    // Счетчик количества введенных символов
                    this.getNumberEnteredCharacters(field, element);

                    if (element) {
                        element.addEventListener('focus', e => this.handlerFocusOnLabel(e, form, field));
                        element.addEventListener('blur', e => this.handlerBlurOnLabel(e, form, field));
                        element.addEventListener('input', e => this.handlerInputOnInput(e, form, field, element/*, dataType*/));
                        element.getAttribute('type') === 'file' ? this.applyStylingFileUpload(element) : null;
                    }

                    this.setAsteriskOnLabels(field, element);
                });

            }
        });
        document.addEventListener('captchaSuccess', function() {
            FORM.forEach(form => {
                form.querySelector('.smart-captcha').classList.remove('is-error');
                errors = false;
            });
        });
    }
    this.setAsteriskOnLabels = function (field, element) {
        if (settings.setAsteriskOnLabels) {
            if (element && element.hasAttribute("data-require")) {
                const type = element.getAttribute("type");
                switch (type) {
                    case 'checkbox':
                        field.querySelector('.checkbox__label span').innerHTML += '<span class="form__require">*</span>';
                        break;
                    default:
                        field.querySelector('.form__label').innerHTML += '<span class="form__require">*</span>';
                        break;
                }
            }
        }
    }
    this.checkingStockAttributeRequireOnInput = function (element) {
        return element.hasAttribute('data-require');
    }
    this.checkingStockAttributePlaceholderOnInput = function (element) {
        return element.hasAttribute('placeholder');
    }
    this.checkingValueAttributeTypeOnInput = function (element, type) {
        return element.getAttribute('type') === type;
    }
    this.setBlockedButtonSubmit = function (form) {
        const idForm = form.getAttribute('data-form-id');
        let filled = {};
        form.querySelector('.form__submit').disabled = settings.forms[idForm] && Object.prototype.hasOwnProperty.call(settings.forms[idForm], 'blockingSendButton') ? settings.forms[idForm].blockingSendButton : settings.forms.default.blockingSendButton;
        form.querySelectorAll('.form__field').forEach(field => {
            const element = field.querySelector(".form__input, .checkbox__input");
            if (element && element.hasAttribute("data-require")) {
                const type = element.getAttribute("type");
                switch (type) {
                    case 'checkbox':
                        element.addEventListener('change', e => this.handlerChangeOnRequireField(e, form, filled));
                        break;
                    default:
                        element.addEventListener('keyup', e => this.handlerChangeOnRequireField(e, form, filled));
                        break;
                }
            }
        });
    }
    this.handlerChangeOnRequireField = function (e, form, filled) {
        let element = e.target,
            name = e.target.getAttribute('name'),
            type = e.target.getAttribute('data-type');
        switch (type) {
            case 'phone':
            case settings.fields.phone.mask:
                element.value.search(/\_/g) === -1 ? filled[name] = true : delete filled[name];
                break;
            case 'agreement':
                element.checked ? filled[name] = true : delete filled[name];
                break;
            default:
                element.value ? filled[name] = true : delete filled[name];
                break;
        }
        form.querySelector('.form__submit').disabled = Object.keys(filled).length !== this.getCountRequireField(form);
    }
    this.getCountRequireField = function (form) {
        return form.querySelectorAll('[data-require]').length;
    }
    this.validateField = function (form, field, element) {
        const dataType = element.getAttribute("data-type");
        switch (dataType) {
            case 'login':
                if (!formData.login.length) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.empty);
                }
                if (formData.login.length < settings.fields.login.min || formData.login.length > settings.fields.login.max) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.login.messages.length);
                }
                if (!/^[a-zA-Z0-9._-]+$/.test(formData.login)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.login.messages.characterType);
                }
                break;
            case 'password':
                if (!formData.password.length) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.empty);
                }
                if (formData.password.length < settings.fields.password.min || formData.password.length > settings.fields.password.max) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.password.messages.length);
                }
                if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",./<>?]).+$/.test(formData.password)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.password.messages.characterType.replace(/\n/g, '<br>'));
                }
                break;
            case 'passwordConfirm':
                if (!formData.passwordConfirm.length) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.passwordConfirm.messages.empty);
                }
                if (formData.password !== formData.passwordConfirm) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.passwordConfirm.messages.mismatch);
                }
                break;
            case 'phone':
                const phonePattern = /^((8|\+374|\+994|\+995|\+375|\+7|\+380|\+38|\+996|\+998|\+993)[\- ]?)?\(?\d{3,5}\)?[\- ]?\d{1}[\- ]?\d{1}[\- ]?\d{1}[\- ]?\d{1}[\- ]?\d{1}(([\- ]?\d{1})?[\- ]?\d{1})?$/i;
                const phoneTest = !phonePattern.test(formData.phone);
                const phoneLength = (formData.phone.match( /\d+/g ).join('')).length > 1;

                if ((this.checkingStockAttributeRequireOnInput(element) && phoneTest) || (phoneLength && phoneTest)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.empty);
                }
                break;
            case 'email':
                const emailPattern = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
                const emailPatternSymbol = /^[a-zA-Z0-9.@-]+$/;
                const emailTest = !emailPattern.test(formData.email);
                const emailTestSymbol = !emailPatternSymbol.test(formData.email);
                const emailLength = formData.email.length;

                if (this.checkingStockAttributeRequireOnInput(element) && !formData.email.length) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.empty);
                }
                if ((this.checkingStockAttributeRequireOnInput(element) && emailTestSymbol) || (emailLength && emailTestSymbol)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.email.messages.characterType);
                }
                if ((this.checkingStockAttributeRequireOnInput(element) && emailTest) || (emailLength && emailTest)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.error);
                }
                break;
            case 'inn':
                if (this.checkingStockAttributeRequireOnInput(element) && !formData.inn.length) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.empty);
                }
                if ((formData.inn.length && formData.inn.length < 10) || this.checkingStockAttributeRequireOnInput(element)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.inn.messages.length);
                }
                break;
            case 'passportNumber':
                const passportNumberPattern = /\d{3}\s\d{6}/;
                const passportNumberTest = !passportNumberPattern.test(formData.passportNumber);
                const passportNumberLength = formData.passportNumber.length;
                if (this.checkingStockAttributeRequireOnInput(element) && !formData.passportNumber.length) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.empty);
                }
                if ((this.checkingStockAttributeRequireOnInput(element) && passportNumberTest) || (passportNumberLength && passportNumberTest)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.error);
                }
                break;
            case 'passportDivision':
                const passportDivisionPattern = /^\d{3}\-\d{3}$/;
                const passportDivisionTest = !passportDivisionPattern.test(formData.passportDivision);
                const passportDivisionLength = formData.passportDivision.length;
                if (this.checkingStockAttributeRequireOnInput(element) && !formData.passportDivision.length) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.empty);
                }
                if ((this.checkingStockAttributeRequireOnInput(element) && passportDivisionTest) || (passportDivisionLength && passportDivisionTest)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.error);
                }
                break;
            case 'snils':
                const snilsPattern = /^\d{3}-\d{3}-\d{3} \d{2}$/;
                const snilsTest = !snilsPattern.test(formData.snils);
                const snilsLength = formData.snils.length;
                if (this.checkingStockAttributeRequireOnInput(element) && !snilsLength) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.empty);
                }
                if ((this.checkingStockAttributeRequireOnInput(element) && snilsTest) || (snilsLength && snilsTest)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.error);
                }
                break;
            case 'ogrn':
                const ogrnPattern = /^[0-9]{13}$/;
                const ogrnTest = !ogrnPattern.test(formData.ogrn);
                const ogrnLength = formData.ogrn.length;
                if (this.checkingStockAttributeRequireOnInput(element) && !ogrnLength) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.empty);
                }
                if ((this.checkingStockAttributeRequireOnInput(element) && ogrnTest && ogrnLength.length < 13) || (ogrnLength && ogrnTest)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.ogrn.messages.length);
                }
                break;
            case 'ogrnip':
                const ogrnipPattern = /^[0-9]{15}$/;
                const ogrnipTest = !ogrnipPattern.test(formData.ogrnip);
                const ogrnipLength = formData.ogrnip.length;
                if (this.checkingStockAttributeRequireOnInput(element) && !ogrnipLength) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.empty);
                }
                if ((this.checkingStockAttributeRequireOnInput(element) && ogrnipTest && ogrnipLength.length < 15) || (ogrnipLength && ogrnipTest)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.ogrnip.messages.length);
                }
                break;
            case 'kpp':
                const kppPattern = /^[0-9]{9}$/;
                const kppTest = !kppPattern.test(formData.kpp);
                const kppLength = formData.kpp.length;
                if (this.checkingStockAttributeRequireOnInput(element) && !kppLength) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.empty);
                }
                if ((this.checkingStockAttributeRequireOnInput(element) && kppTest && kppLength.length < 9) || (kppLength && kppTest)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.kpp.messages.length);
                }
                break;
            case 'bik':
                const bikPattern = /^[0-9]{9}$/;
                const bikTest = !bikPattern.test(formData.bik);
                const bikLength = formData.bik.length;
                if (this.checkingStockAttributeRequireOnInput(element) && !bikLength) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.empty);
                }
                if ((this.checkingStockAttributeRequireOnInput(element) && bikTest && bikLength.length < 9) || (bikLength && bikTest)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.bik.messages.length);
                }
                break;
            case 'paymentAccount':
                const paymentAccountPattern = /^(?:[\. ]*\d){20}$/;
                const paymentAccountTest = !paymentAccountPattern.test(formData.paymentAccount);
                const paymentAccountLength = formData.paymentAccount.length;
                if (this.checkingStockAttributeRequireOnInput(element) && !paymentAccountLength) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.default.messages.empty);
                }
                if ((this.checkingStockAttributeRequireOnInput(element) && paymentAccountTest && paymentAccountLength.length < 20) || (paymentAccountLength && paymentAccountTest)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, settings.fields.paymentAccount.messages.length);
                }
                break;
            case 'agreement':
                if (this.checkingStockAttributeRequireOnInput(element) && !element.checked) {
                    errors = true;
                    this.addClassOnError(field);
                }
                break;
            default:
                if (dataType) {
                    if (!formData[dataType].length && this.checkingStockAttributeRequireOnInput(element)) {
                        errors = true;
                        this.addClassOnError(field);
                        this.addMessageOnError(field, settings.fields.default.messages.empty);
                    }
                }
                break;
        }
    }
    this.validateForm = function (form, e) {
        e.preventDefault();
        this.serializeForm(form);
        errors = false;

        let warningElems = form.querySelectorAll(".form__field.is-error") || true;
        if (warningElems.length) {
            warningElems.forEach(function (warningElem) {
                return warningElem.classList.remove("is-error");
            });
        }
        form.querySelectorAll('.form__field').forEach(field => {
            let element = field.querySelector("input, textarea, select");
            this.validateField(form, field, element);
        });

        if (typeof settings.captcha === "object" && settings.captcha.active === 'yandex') {
            if (formData["smart-token"] === '') {
                errors = true;
                this.addClassOnError(form.querySelector('.smart-captcha'));
            }
        }

        if (errors) {
            return;
        }

        if (typeof settings.captcha === "object" && settings.captcha.active === 'google') {
            this.getTokenGoogleCaptcha(form);
        } else {
            form.submit();
        }

    }
    this.serializeForm = function (form) {
        formData = {};
        try {
            new FormData(form).forEach((value, key) => {
                formData[key] = value.trim();
            });
        } catch (error) {
            console.log("Error:", error);
        }
    }
    this.getTokenGoogleCaptcha = function (form) {
        grecaptcha.ready(() => {
            grecaptcha.execute(settings.captcha.key, {
                action: 'add_form'
            })
                .then(token => {
                    this.setTokenGoogleCaptcha(form, token);
                });
        });
    }
    this.setTokenGoogleCaptcha = function (form, token) {
        form.querySelector('input[name="g-recaptcha-response"]').value = token;
        this.serializeForm(form);
        this.sendingFormData(form);
    }
    this.handlerOnSubmitForm = function (e, form) {
        this.validateForm(form, e);
    }
    this.addClassOnError = function (field) {
        field.classList.add("is-error");
    }
    this.removeClassOnError = function (field) {
        field.classList.remove("is-error");
    }
    this.addMessageOnError = function (field, message) {
        if (!field.querySelector('.form__error-message')) {
            field.insertAdjacentHTML('beforeend', `<div class="form__error-message">${message}</div>`);
        }
    }
    this.removeMessageOnError = function (field) {
        if (field.querySelector('.form__error-message')) {
            field.querySelector('.form__error-message').remove();
        }
    }
    this.addMasked = function (element) {
        if (element) {
            switch (element.getAttribute('data-type')) {
                case "passportNumber":
                    new IMask(element, {
                        mask: '0000 000000',
                        lazy: true,
                    });
                    break;
                case "passportDivision":
                    new IMask(element, {
                        mask: '000-000',
                        lazy: true,
                    });
                    break;
                case "inn":
                    new IMask(element, {
                        mask: '000000000000',
                        regex: '^\d{10}|\d{12}$',
                        lazy: true,
                    });
                    break;
                case "snils":
                    new IMask(element, {
                        mask: '000-000-000 00',
                        lazy: true,
                    });
                    break;
                case "ogrn":
                    new IMask(element, {
                        mask: '0000000000000',
                        lazy: true,
                    });
                    break;
                case "ogrnip":
                    new IMask(element, {
                        mask: '000000000000000',
                        lazy: true,
                    });
                    break;
                case "kpp":
                    new IMask(element, {
                        mask: '000000000',
                        lazy: true,
                    });
                    break;
                case "bik":
                    new IMask(element, {
                        mask: '000000000',
                        lazy: true,
                    });
                    break;
                case "paymentAccount":
                    new IMask(element, {
                        mask: '00000 000 0 0000 0000000',
                        lazy: true,
                    });
                    break;
                case "phone":
                    if (settings.fields.phone.mask) {
                        new IMask(element, {
                            mask: "+{7} (000) 000-00-00",
                            lazy: false,
                        });
                        // new IMask(element, {
                        //     mask: [
                        //         {
                        //             mask: '+{0} (000) 000-00-00',
                        //             startsWith: '7',
                        //             lazy: false,
                        //             country: 'Russia'
                        //         },
                        //         {
                        //             mask: '{0} (000) 000-00-00',
                        //             startsWith: '8',
                        //             lazy: false,
                        //             country: 'Russia'
                        //         },
                        //     ],
                        //     dispatch: (appended, dynamicMasked) => {
                        //         const number = (dynamicMasked.value + appended).replace(/\D/g, '');
                        //         return dynamicMasked.compiledMasks.find(m => number.indexOf(m.startsWith) === 0);
                        //     }
                        // })
                    }
                    break;
                default:
                    break;
            }
        }
    }
    this.handlerFocusOnLabel = function (e, form, field) {
        if (field.querySelector('.form__label') && field.querySelector('.form__input').getAttribute('type') !== 'checkbox') {
            field.classList.add('is-focused');
            if (form.classList.contains('form-with-hidding-label')) {
                field.querySelector('.form__label').classList.add('is-hidden');
            }
        }
    }
    this.handlerBlurOnLabel = function (e, form, field) {
        if (field.querySelector('.form__label') && e.currentTarget.value === '') {
            field.querySelector('.form__label').classList.remove('is-hidden');
            field.classList.remove('is-focused');
        }
    }
    this.handlerInputOnInput = function (e, form, field, element) {
        this.removeClassOnError(field);
        this.removeMessageOnError(field);

        // Счетчик количества введенных символов
        this.getNumberEnteredCharacters(field, element);
    }
    this.applyStylingFileUpload = function (element) {
        $(element).simpleFileInput({
            placeholder: 'Прикрепить файл',
            buttonText: '',
            width: 'false',
        });
    }
    this.sendingFormData = function (form) {
        const idForm = form.getAttribute('data-form-id');
        const referenceOnObject = settings.forms[idForm] && settings.forms[idForm].hasOwnProperty('ajax') ? idForm : 'default';
        const data = settings.forms[referenceOnObject];
        fetch(data.ajax, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(formData).toString()
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка запроса');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // console.log('Заявка успешно отправлена');
                    this.openPopupSuccessfulSending();
                } else {
                    this.openPopupErrorSending();
                }
            })
            .catch(error => {
                this.openPopupErrorSending();
                console.log(error);
            });
    }
    this.openPopupSuccessfulSending = function (form) {
        document.body.querySelector(`.${settings.popups.classSuccessful}`).classList.add(settings.popups.classOpened);
    }
    this.openPopupErrorSending = function (form) {
        document.body.querySelector(`.${settings.popups.classError}`).classList.add(settings.popups.classOpened);
    }

    // Иконка показать/скрыть введенные символы
    this.addingCharacterDisplay = function (field) {
        let element = field.querySelector(".form__input");
        if (element) {
            if (element.getAttribute('data-type') === 'password' || element.getAttribute('data-type') === 'passwordConfirm') {
                this.addingGroupFieldIcons(field);
                elemGroupFieldIcon.insertAdjacentHTML('beforeend', `
                    <div class="form__characters-display-icon">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 5.00082C6.34357 5.00082 5.00077 6.34362 5.00077 8.00005C5.00077 9.65647 6.34357 10.9993 8 10.9993C9.65642 10.9993 10.9992 9.65647 10.9992 8.00005C10.9992 6.34362 9.65642 5.00082 8 5.00082ZM6.00077 8.00005C6.00077 6.89591 6.89586 6.00082 8 6.00082C9.10414 6.00082 9.99922 6.89591 9.99922 8.00005C9.99922 9.10419 9.10414 9.99927 8 9.99927C6.89586 9.99927 6.00077 9.10419 6.00077 8.00005Z" fill="#222222"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8 2.75C4.59429 2.75 1.68254 4.85238 0.531638 7.81917C0.486509 7.9355 0.486509 8.0645 0.531638 8.18084C1.68254 11.1476 4.59429 13.25 8 13.25C11.4057 13.25 14.3175 11.1476 15.4684 8.18083C15.5135 8.0645 15.5135 7.9355 15.4684 7.81917C14.3175 4.85238 11.4057 2.75 8 2.75ZM8 12.25C5.08376 12.25 2.58765 10.4929 1.53711 8C2.58765 5.50712 5.08376 3.75 8 3.75C10.9162 3.75 13.4123 5.50712 14.4629 8C13.4123 10.4929 10.9162 12.25 8 12.25Z" fill="#222222"/></svg>
                    </div>
                `);
                field.querySelector('.form__characters-display-icon').addEventListener('click', e => this.handlerClickOnCharacterDisplay(e, field, element));
            }
        }
    }
    this.handlerClickOnCharacterDisplay = function (e, field, element) {
        const icon = field.querySelector('.form__characters-display-icon');
        icon ? icon.innerHTML = '' : null;
        if (element.getAttribute('type') === 'password') {
            element.setAttribute('type', 'text');
            this.replaceIconInCharacterDisplay(icon, 'hide');
        } else {
            element.setAttribute('type', 'password');
            this.replaceIconInCharacterDisplay(icon, 'show');
        }
    }
    this.replaceIconInCharacterDisplay = function (icon, value) {
        if (value === 'show') {
            icon.insertAdjacentHTML('beforeend', `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 5.00082C6.34357 5.00082 5.00077 6.34362 5.00077 8.00005C5.00077 9.65647 6.34357 10.9993 8 10.9993C9.65642 10.9993 10.9992 9.65647 10.9992 8.00005C10.9992 6.34362 9.65642 5.00082 8 5.00082ZM6.00077 8.00005C6.00077 6.89591 6.89586 6.00082 8 6.00082C9.10414 6.00082 9.99922 6.89591 9.99922 8.00005C9.99922 9.10419 9.10414 9.99927 8 9.99927C6.89586 9.99927 6.00077 9.10419 6.00077 8.00005Z" fill="#222222"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8 2.75C4.59429 2.75 1.68254 4.85238 0.531638 7.81917C0.486509 7.9355 0.486509 8.0645 0.531638 8.18084C1.68254 11.1476 4.59429 13.25 8 13.25C11.4057 13.25 14.3175 11.1476 15.4684 8.18083C15.5135 8.0645 15.5135 7.9355 15.4684 7.81917C14.3175 4.85238 11.4057 2.75 8 2.75ZM8 12.25C5.08376 12.25 2.58765 10.4929 1.53711 8C2.58765 5.50712 5.08376 3.75 8 3.75C10.9162 3.75 13.4123 5.50712 14.4629 8C13.4123 10.4929 10.9162 12.25 8 12.25Z" fill="#222222"/></svg>
            `);
        } else {
            icon.insertAdjacentHTML('beforeend', `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.35355 1.64645C2.15829 1.45118 1.84171 1.45118 1.64645 1.64645C1.45118 1.84171 1.45118 2.15829 1.64645 2.35355L3.44673 4.15383C2.13656 5.05128 1.11099 6.3257 0.531638 7.81917C0.486509 7.9355 0.486509 8.0645 0.531638 8.18084C1.68254 11.1476 4.59429 13.25 8 13.25C9.32103 13.25 10.5677 12.9337 11.6662 12.3733L13.6464 14.3536C13.8417 14.5488 14.1583 14.5488 14.3536 14.3536C14.5488 14.1583 14.5488 13.8417 14.3536 13.6464L2.35355 1.64645ZM10.9171 11.6242L9.73774 10.4448C9.24747 10.794 8.64771 10.9993 8 10.9993C6.34357 10.9993 5.00077 9.65647 5.00077 8.00005C5.00077 7.35233 5.20609 6.75258 5.5552 6.26231L4.1679 4.87501C3.00128 5.62899 2.07776 6.71706 1.53711 8C2.58765 10.4929 5.08376 12.25 8 12.25C9.04151 12.25 10.0294 12.0259 10.9171 11.6242ZM6.27749 6.9846C6.10167 7.28221 6.00077 7.62935 6.00077 8.00005C6.00077 9.10419 6.89586 9.99927 8 9.99927C8.3707 9.99927 8.71784 9.89838 9.01545 9.72255L6.27749 6.9846Z" fill="#222222"/><path d="M7.71157 5.01451L8.92349 6.22643C9.28655 6.41586 9.58419 6.7135 9.77361 7.07656L10.9855 8.28848C10.9946 8.19356 10.9992 8.09734 10.9992 8.00005C10.9992 6.34362 9.65642 5.00082 8 5.00082C7.9027 5.00082 7.80649 5.00546 7.71157 5.01451Z" fill="#222222"/><path d="M14.4629 8C14.107 8.84447 13.5853 9.60451 12.9375 10.2404L13.6446 10.9475C14.4351 10.1696 15.0617 9.22921 15.4684 8.18083C15.5135 8.0645 15.5135 7.9355 15.4684 7.81917C14.3175 4.85238 11.4057 2.75 8 2.75C7.22285 2.75 6.47142 2.85947 5.76076 3.06371L6.58756 3.8905C7.04368 3.79839 7.51605 3.75 8 3.75C10.9162 3.75 13.4123 5.50712 14.4629 8Z" fill="#222222"/></svg>
            `);
        }
    }

    // Счетчик количества введенных символов
    this.getNumberEnteredCharacters = function (field, element) {
        if (element && element.getAttribute("data-type")) {
            let dataType = element.getAttribute("data-type");
            let quantity = element.value.length;

            if (settings.fields[dataType] && settings.fields[dataType].displayNumberCharacterEntered && !settings.fields[dataType].displayLimitNumberCharacterEntered) {
                !field.querySelector('.form__counter-entered-characters') ? this.addingNumberCharactersEntered(field, quantity) : this.updatingNumberCharacters(field, quantity);
            }
            if (settings.fields[dataType] && !settings.fields[dataType].displayNumberCharacterEntered && settings.fields[dataType].displayLimitNumberCharacterEntered) {
                quantity = settings.fields[dataType].max - quantity;
                !field.querySelector('.form__counter-entered-characters') ? this.addingRemainingNumberCharacters(field, quantity) : this.updatingNumberCharacters(field, quantity);
                quantity < 0 ? this.addClassOnErrorRemainingNumberCharacters(field) : this.removeClassOnErrorRemainingNumberCharacters(field);
            }
        }
    }
    this.addingNumberCharactersEntered = function (field, value) {
        this.addingGroupFieldIcons(field);
        if (elemGroupFieldIcon) {
            elemGroupFieldIcon.insertAdjacentHTML('beforeend', `<div class="form__counter-entered-characters">${value}</div>`);
        }
    }
    this.updatingNumberCharacters = function (field, value) {
        field.querySelector('.form__counter-entered-characters').textContent = value;
    }
    this.addingRemainingNumberCharacters = function (field, value) {
        this.addingGroupFieldIcons(field);
        elemGroupFieldIcon.insertAdjacentHTML('beforeend', `<div class="form__counter-entered-characters">${value}</div>`);
    }
    this.addClassOnErrorRemainingNumberCharacters = function (field) {
        field.querySelector('.form__counter-entered-characters').classList.add("is-error");
    }
    this.removeClassOnErrorRemainingNumberCharacters = function (field) {
        field.querySelector('.form__counter-entered-characters').classList.remove("is-error");
    }

    /* Дополнительные элементы в полях */
    this.addingGroupFieldIcons = function (field) {
        if (!field.contains(field.querySelector('.form__group-field-icons'))) {
            if (field.querySelector('.form__input-wrapper')) {
                field.querySelector('.form__input-wrapper').insertAdjacentHTML('beforeend', `<div class="form__group-field-icons"></div>`);
                elemGroupFieldIcon = field.querySelector('.form__group-field-icons');
            }
        }
    }

    if (FORM) {
        this.init();
    }
}

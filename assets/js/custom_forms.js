/**
 *
 * Custom Forms
 * Валидация форм
 *
 * @author      Mihail Pridannikov
 * @copyright   2023-2026, Mihail Pridannikov
 * @license MIT
 * @version     3.0.0
 * @release     2025
 * @link        https://github.com/mihail-174/custom_forms
 *
 */

const Form = function (settings) {
    const FORM = document.querySelectorAll('form');

    let errors = false;

    const SETTINGS = {
        blockedButtonSubmit: false,
        phoneMask: true,
        captcha: false,
        captchaKey: '6LeE740lAAAAAMpDp4bvjLC9CAxlY6QTo_lFiXOy',
        captchaInputClass: 'token_v3',
        urlSendingFormData: 'ajax/form.php',
        classPopupSuccessful: 'popup-success',
        classPopupError: 'popup-error',
        classActiveOnPopup: 'is-opened',
    }

    let formData = {};

    this.init = function () {
        FORM.forEach(form => {
            if (form) {
                // проверка параметра "режима блокировки кнопки отправки"
                if (this.getParameter('blockedButtonSubmit')) {
                    this.setBlockedButtonSubmit(form);
                } else {
                    form.addEventListener('submit', e => this.handlerOnSubmitForm(e, form));
                }

                // проверка параметра "маски телефона"
                if (this.getParameter('phoneMask')) {
                    form.querySelector('[data-type="phone"]') ? this.addMaskPhone(form.querySelector('[data-type="phone"]')) : null;
                }

                // пробегаемся по полям:
                // 1. добавляем класс "is-focused" при установки курсора и введенного текста
                // 2. добавляем события "focus", "blur", "input"
                // 3. применяем стилизацию для поля "file"
                // 4. устанавливаем "*" в лейбле поля и в плейсхолдере
                form.querySelectorAll('.form__field').forEach(field => {
                    let element = field.querySelector(".form__input");
                    if (element.value !== '' && element.getAttribute('type') !== 'checkbox' && element.getAttribute('type') !== 'radio') {
                        if (form.classList.contains('form-with-hidding-label')) {
                            field.querySelector('.form__label').classList.add('is-hidden');
                        } else {
                            field.classList.add('is-focused');
                        }
                    }
                    element.addEventListener('focus', e => this.handlerFocusOnLabel(e, form, field));
                    element.addEventListener('blur', e => this.handlerBlurOnLabel(e, form, field));
                    element.addEventListener('input', e => this.handlerInputOnInput(e, form, field, element));
                    element.getAttribute('type') === 'file' ? this.applyStylingFileUpload(element) : null;

                    // устанавливаем "*" в лейбле поля и в плейсхолдере
                    this.setLabelRequireOnField(field, element);
                });

            }

        });
    }

    this.getParameter = function (value) {
        // получаем параметр из кастомных настроек, если там нету, то из значений по умолчанию
        // if (this.checkingCustomSettings() && this.checkingCustomParameter(value)) {
        //     console.log(`"${value}" (Кастомный) = ${settings[value]}`);
        // } else {
        //     console.log(`"${value}" (Дефолтный) = ${SETTINGS[value]}`);
        // }
        return this.checkingCustomSettings() && this.checkingCustomParameter(value) ? settings[value] : SETTINGS[value];
    }
    this.checkingCustomSettings = function () {
        return (typeof settings === 'object' && Object.keys(settings).length > 0);
    }
    this.checkingCustomParameter = function (value) {
        return typeof settings[value] !== 'undefined'
    }
    this.setLabelRequireOnField = function (field, element) {
        // устанавливаем "*" в лейбле поля и в плейсхолдере
        if (element.hasAttribute("data-require") && !this.checkingValueAttributeTypeOnInput(element, 'checkbox')) {
            field.querySelector('.form__label').innerHTML += '<span class="form__require">*</span>';
            if (this.checkingStockAttributePlaceholderOnInput(element)) {
                element.setAttribute('placeholder', element.getAttribute('placeholder') + '*');
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
        let filled = {};
        form.querySelector('.form__submit').disabled = true;
        form.querySelectorAll('.form__field').forEach(field => {
            const element = field.querySelector(".form__input");
            if (element.hasAttribute("data-require")) {
                // if (element.getAttribute("data-type") === 'agreement') {
                //     filled[element.getAttribute("name")] = true;
                // }
                element.addEventListener('input', e => this.handlerChangeOnRequireField(e, form, filled));
            }
        });
    }
    this.handlerChangeOnRequireField = function (e, form, filled) {
        // console.clear();
        let element = e.target,
            name = e.target.getAttribute('name'),
            type = e.target.getAttribute('data-type');
        switch (type) {
            case 'phone':
                if (e.target.value.match(/\d+/g) && (e.target.value.match( /\d+/g ).join('')).length === 11) {
                    filled[name] = true;
                } else {
                    delete filled[name];
                }
                // if (e.target.value !== '' && e.target.value !== ' (___) ___-__-__' && e.target.value !== '+ (___) ___-__-__' && e.target.value !== '+7(___)___-__-__') {
                //     filled[name] = true;
                // } else if (e.target.value === ' (___) ___-__-__' || e.target.value === '+ (___) ___-__-__' || e.target.value === '+7(___)___-__-__') {
                //     delete filled[name];
                // } else {
                //     delete filled[name];
                // }
                break;
            case 'agreement':
                if (element.checked) {
                    filled[name] = true;
                } else {
                    delete filled[name];
                }
                break;
            default:
                if (e.target.value) {
                    filled[name] = true;
                } else {
                    delete filled[name];
                }
                break;
        }
        if (Object.keys(filled).length === this.getCountRequireField(form)) {
            form.querySelector('.form__submit').disabled = false;
        } else {
            form.querySelector('.form__submit').disabled = true;
        }
    }
    this.getCountRequireField = function (form) {
        return form.querySelectorAll('.form__input[data-require]').length;
    }
    this.validateField = function (form, field, element) {
        // const name = element.getAttribute("name");
        const type = element.getAttribute("data-type");
        switch (type) {
            case 'login':
                if (!formData.login.length) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, 'Поле заполнено некорректно');
                }
                if (!/^[a-zA-Z0-9]+$/.test(formData.login)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, 'Логин может содержать только буквы на латинице и цифры');
                }
                if (formData.login.length < 3) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, 'Логин должен состоять не менее 3 символов');
                }
                break;
            case 'password':
                if (!formData.password.length) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, 'Поле заполнено некорректно');
                }
                if (formData.password.length < 6) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, 'Пароль должен состоять не менее 6 символов');
                }
                if (formData.password.length > 10) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, 'Пароль должен состоять не более 10 символов');
                }
                if (!/^[a-zA-Z0-9]+$/.test(formData.password)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, 'Пароль может содержать только буквы на латинице и цифры');
                }
                if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{6,10}$/.test(formData.password)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, 'Пароль должен содержать как минимум одну заглавную букву, одну строчную букву и одну цифру');
                }
                break;
            case 'passwordConfirm':
                if (!formData.passwordConfirm.length) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, 'Повторите пароль');
                }
                if (formData.password !== formData.passwordConfirm) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, 'Пароли не совпадают');
                }
                break;
            case 'phone':
                const phonePattern = /^((8|\+374|\+994|\+995|\+375|\+7|\+380|\+38|\+996|\+998|\+993)[\- ]?)?\(?\d{3,5}\)?[\- ]?\d{1}[\- ]?\d{1}[\- ]?\d{1}[\- ]?\d{1}[\- ]?\d{1}(([\- ]?\d{1})?[\- ]?\d{1})?$/i;
                const phoneTest = !phonePattern.test(formData.phone);
                const phoneLength = (formData.phone.match( /\d+/g ).join('')).length > 1;

                if ((this.checkingStockAttributeRequireOnInput(element) && phoneTest) || (phoneLength && phoneTest)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, "Поле заполнено некорректно");
                }
                // if (data.rules[type].test(element.value)) {
                //     this.removeMessageOnError(field);
                // } else {
                //     errors = true;
                //     this.addClassOnError(field);
                //     this.addMessageOnError(field, data.messages.fields[type]);
                // }
                break;
            case 'email':
                const emailPattern = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
                const emailPatternSymbol = /^[a-zA-Z0-9.@-]+$/;
                const emailTest = !emailPattern.test(formData.email);
                const emailTestSymbol = !emailPatternSymbol.test(formData.email);
                const emailLength = formData.email.length;

                if ((this.checkingStockAttributeRequireOnInput(element) && emailTestSymbol) || (emailLength && emailTestSymbol)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, 'Почта может содержать только буквы на латинице, цифры и символы: дефис и точка');
                }
                if ((this.checkingStockAttributeRequireOnInput(element) && emailTest) || (emailLength && emailTest)) {
                    errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, "Поле заполнено некорректно");
                }
                // if (data.rules[type].test(element.value)) {
                //     this.removeMessageOnError(field);
                // } else {
                //     errors = true;
                //     this.addClassOnError(field);
                //     this.addMessageOnError(field, data.messages.fields[type]);
                // }
                break;
            case 'agreement':
                if (!element.checked) {
                    errors = true;
                    this.addClassOnError(field);
                }
                // if (element.checked) {
                //     this.removeMessageOnError(field);
                // } else {
                //     errors = true;
                //     this.addClassOnError(field);
                // }
                break;
            default:
                if (type) {
                    if (!formData[type].length && this.checkingStockAttributeRequireOnInput(element)) {
                        errors = true;
                        this.addClassOnError(field);
                        this.addMessageOnError(field, "Поле заполнено некорректно");
                    }
                }
                // if (element.value === '') {
                //     errors = true;
                //     this.addClassOnError(field);
                //     this.addMessageOnError(field, data.messages.default);
                // } else {
                //     this.removeMessageOnError(field);
                // }
                break;
        }
    }
    this.serializeForm = function (form) {
        formData = {};
        try {
            new FormData(form).forEach((value, key) => {
                formData[key] = value.trim();
            });
            // this.fetchToSend();
        } catch (error) {
            console.log("Error:", error);
        }
    }
    this.validateForm = function (form, e) {
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
            // if (element.hasAttribute("data-require")) {
            this.validateField(form, field, element);
            // }
        });
        if (errors) {
            e.preventDefault();
        } else {
            e.preventDefault();
            // console.log(this.getParameter('captcha'))
            // this.sendingFormData(form);
            if (this.getParameter('captcha')) {
                // когда параметр 'captcha' = true, то делаем получение токена ти устанавливаем токен в скрытый инпут
                e.preventDefault();
                this.getCaptchaToken(form);
            } else {
                form.submit();
            }
        }
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
    this.addMaskPhone = function (element) {
        new IMask(element, {
            mask: "+{7}(000)000-00-00",
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
    }
    this.applyStylingFileUpload = function (element) {
        $(element).simpleFileInput({
            placeholder: 'Прикрепить файл',
            buttonText: '',
            width: 'false',
        });
    }
    this.getCaptchaToken = function (form) {
        grecaptcha.ready(() => {
            grecaptcha.execute(this.getParameter('captchaKey'), {
                action: 'add_form'
            })
                .then(token => {
                    this.setCaptchaToken(form, token);
                });
        });
    }
    this.setCaptchaToken = function (form, token) {
        form.querySelector(`.${this.getParameter('captchaInputClass')}`).value = token;
        this.serializeForm(form);
        this.sendingFormData(form);
    }
    this.sendingFormData = function (form) {
        fetch(this.getParameter('urlSendingFormData'), {
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
                // console.log(data);
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
        document.body.querySelector(`.${this.getParameter('classPopupSuccessful')}`).classList.add(this.getParameter('classActiveOnPopup'));
    }
    this.openPopupErrorSending = function (form) {
        document.body.querySelector(`.${this.getParameter('classPopupError')}`).classList.add(this.getParameter('classActiveOnPopup'));
    }

    if (FORM) {
        this.init();
    }
}
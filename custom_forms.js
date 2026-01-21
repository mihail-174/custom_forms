const Form = function (settings) {
    const FORM = document.querySelectorAll('form');

    let data = {
        errors: false,
        rules: {
            phone: /^((8|\+374|\+994|\+995|\+375|\+7|\+380|\+38|\+996|\+998|\+993)[\- ]?)?\(?\d{3,5}\)?[\- ]?\d{1}[\- ]?\d{1}[\- ]?\d{1}[\- ]?\d{1}[\- ]?\d{1}(([\- ]?\d{1})?[\- ]?\d{1})?$/i,
            email: /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i,
        },
        messages: {
            default: "Поле заполнено некорректно",
            fields: {
                phone: "Поле заполнено некорректно",
                email: "Поле заполнено некорректно",
            },
        },
    }

    this.init = function () {
        FORM.forEach(form => {
            form.querySelector('[data-type="phone"]') ? this.addMaskPhone(form.querySelector('[data-type="phone"]')) : null;

            // если включен режим блокировки кнопки отправки
            if (settings.blockedButtonSubmit) {
                this.setBlockedButtonSubmit(form);
            } else {
                form.addEventListener('submit', e => this.handlerOnSubmitForm(e, form));
            }

            form.querySelectorAll('.form__field').forEach(field => {
                let element = field.querySelector(".form__input");
                if (element.value !== '' && element.getAttribute('type') !== 'checkbox') {
                    if (form.classList.contains('form-with-hidding-label')) {
                        field.querySelector('.form__label').classList.add('is-hidden');
                    } else {
                        field.classList.add('is-focused');
                    }
                }
                element.addEventListener('focus', e => this.handlerFocusOnLabel(e, form, field));
                element.addEventListener('blur', e => this.handlerBlurOnLabel(e, form, field));
            });

        });
    }
    this.setBlockedButtonSubmit = function (form) {
        let filled = {};
        form.querySelector('.form__submit').disabled = true;
        form.querySelectorAll('.form__field').forEach(field => {
            let element = field.querySelector(".form__input");
            if (element.getAttribute("data-require")) {
                if (element.getAttribute("data-type") === 'agreement') {
                    filled[element.getAttribute("name")] = true;
                }
                element.addEventListener('input', e => this.handlerChangeOnRequireField(e, form, filled));
            }
        });
    }
    this.getCountRequireField = function (form) {
        return form.querySelectorAll('.form__input[data-require]').length;
    }
    this.handlerChangeOnRequireField = function (e, form, filled) {
        let element = e.target,
            name = e.target.getAttribute('name'),
            type = e.target.getAttribute('data-type');
        switch (type) {
            case 'phone':
                if (e.target.value !== '' && e.target.value !== ' (___) ___-__-__' && e.target.value !== '+ (___) ___-__-__') {
                    filled[name] = true;
                } else if (e.target.value === ' (___) ___-__-__' || e.target.value === '+ (___) ___-__-__') {
                    delete filled[name];
                } else {
                    delete filled[name];
                }
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
    this.validateField = function (form, field, element) {
        let type = element.getAttribute("data-type");

        switch (type) {
            case 'phone':
                if (data.rules[type].test(element.value)) {
                    this.removeMessageOnError(field);
                } else {
                    data.errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, data.messages.fields[type]);
                }
                break;
            case 'email':
                if (data.rules[type].test(element.value)) {
                    this.removeMessageOnError(field);
                } else {
                    data.errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, data.messages.fields[type]);
                }
                break;
            case 'agreement':
                if (form.querySelector('.form__field-agreement .form__input').checked) {
                    this.removeMessageOnError(field);
                } else {
                    data.errors = true;
                    this.addClassOnError(field);
                }
                break;
            default:
                if (element.value === '') {
                    data.errors = true;
                    this.addClassOnError(field);
                    this.addMessageOnError(field, data.messages.default);
                } else {
                    this.removeMessageOnError(field);
                }
                break;
        }
    }
    this.validateForm = function (form, e) {
        data.errors = false;
        let warningElems = form.querySelectorAll(".form__field.is-error") || true;
        if (warningElems.length) {
            warningElems.forEach(function (warningElem) {
                return warningElem.classList.remove("is-error");
            });
        }
        form.querySelectorAll('.form__field').forEach(field => {
            let element = field.querySelector("input, textarea, select");
            if (element.getAttribute("data-require")) {
                this.validateField(form, field, element);
            }
        });
        if (data.errors) {
            e.preventDefault();
        } else {
            form.submit();
        }
    }
    this.handlerOnSubmitForm = function (e, form) {
        this.validateForm(form, e);
    }
    this.addClassOnError = function (field) {
        field.classList.add("is-error");
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
            mask: [
                {
                    mask: '+{0} (000) 000-00-00',
                    startsWith: '7',
                    lazy: false,
                    country: 'Russia'
                },
                {
                    mask: '{0} (000) 000-00-00',
                    startsWith: '8',
                    lazy: false,
                    country: 'Russia'
                },
            ],
            dispatch: (appended, dynamicMasked) => {
                const number = (dynamicMasked.value + appended).replace(/\D/g, '');
                return dynamicMasked.compiledMasks.find(m => number.indexOf(m.startsWith) === 0);
            }
        })
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

    FORM ? this.init() : null;
}
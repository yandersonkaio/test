//const fs = require('fs');
//const path = require('path');
//const config = require(path.join(__dirname, 'config'));
//const contacts = require(path.join(__dirname, 'contacts'));
//const view_old_chats = require('./view_old_chats');
//const theme_handler = require('./utils/theme_handler');
const g_app_version = "2.8.0";

//let browserTitle;

// document.addEventListener('DOMContentLoaded', () => {
//     browserTitle = document.title;

//     init();
// });

const _ = (a, b) => {
    if (!b) {
        b = a;
        a = wtm.document;
    }
    return a ? a.querySelector(b) : null;
};

var config = {
    cluster: 'itrader.talkmanager.net',
    session: {
        base_url: ''
    },
    params: {
        set: (key, val) => localStorage.setItem(key, val),
        get: (key) => { return localStorage.getItem(key) }
    }
};

const theme_handler = {
    theme: "",

    theme_selector: (div, theme) => {
        if (theme) {
            div.classList.add("dark_theme");
        } else {
            div.classList.add("light_theme");
        }
    },

    change_button_color: () => {
        let side = document.querySelector("div#side");
        if (side) {
            const container = side.querySelector(".buttons-container");
            side.removeChild(container);
        }
    },

    init: () => {
        let whats_theme = document.querySelector("body");
        let local_storage = localStorage.getItem("agent_theme");

        if (whats_theme.className == "web") {
            if (local_storage != "light") {
                localStorage.setItem("agent_theme", "light");
                theme_handler.change_button_color();
            }
            theme_handler.theme = "light";
        } else if (whats_theme.className == "web dark") {
            if (local_storage != "dark") {
                localStorage.setItem("agent_theme", "dark");
                theme_handler.change_button_color();
            }
            theme_handler.theme = "dark";
        }

        if (theme_handler.theme == "light") {
            return false;
        } else if (theme_handler.theme == "dark") {
            return true;
        }
    },
};

const contacts = {
    need_creation: false,
    contactDict: {},
    observers: {},
    insert_contacts: (document, list, search_for_contacts) => {
        if (!list) {
            return;
        }

        let panel;

        if (!document.querySelector('div[data-testid="search-no-chats-or-contacts"]')) {
            if (!document.querySelector('div[data-testid="searching-chats-contacts-messages"]')) {
                search_for_contacts.attempts = 0;
                return;
            }
            else {
                search_for_contacts.attempts += 1;
            }
            if (search_for_contacts.attempts <= 8) {
                return;
            }
            else {
                search_for_contacts.attempts = 0;
                panel = document.querySelector('div[data-testid="searching-chats-contacts-messages"]');
            }
        } else {
            search_for_contacts.attempts = 0;
            panel = document.querySelector('div[data-testid="search-no-chats-or-contacts"]');
        }

        const not_found_message = panel.querySelector('span');

        if (not_found_message) {
            contacts.need_creation = true;
        }

        const search_input = document.querySelector('div[data-testid="chat-list-search"]');

        if (panel && contacts.need_creation && search_input && search_input.innerText !== '') {
            contacts.need_creation = false;

            let result = contacts.create_list(search_input.innerText, list);

            if (result.childNodes.length == 0) {
                return;
            }

            not_found_message.remove();
            panel.parentElement.style = 'padding-right: 0px; padding-left: 0px; padding-top: 0px; padding-bottom: 0px; display: inline';
            panel.style = 'display: block';
            panel.appendChild(result);
        }
    },
    create_list: (input, list) => {
        let result = document.createElement('div');
        list.forEach((person, _) => {
            if (person['contact'].toLowerCase().indexOf(input.toLowerCase()) !== -1 || person['number'].indexOf(input) !== -1) {
                let container = document.createElement('div');
                container.id = `contact-${person['number']}`;
                container.style = 'border-top-color: var(--background-default-active); border-top: 1px solid var(--background-default-hover);';
                let contact = document.createElement('div');
                contact.style = `display: flex; 
                flex-grow: 1;
                overflow: hidden;
                font-size: 17px;
                font-weight: 400;
                line-height: 21px;
                margin-top: 10px;
                margin-left: 10px;
                margin-right: 10px;
                color: var(--primary-strong);`
                contact.textContent = person['contact'];
                let number = document.createElement('div');
                number.style = `margin-bottom: 10px;
                margin-left: 10px;
                margin-right: 10px;
                text-align: left;`
                number.textContent = person['number'];

                container.appendChild(contact);
                container.appendChild(number);
                container.addEventListener('click', () => { contacts.open(person['number']); });
                result.appendChild(container);
            }
        });

        return result;
    },
    open: (phone) => {
        window.location = `https://web.whatsapp.com/send?phone=${phone}&text&app_absent=0`;
    },
    fetch_registered_contacts: async (url) => {
        try {
            const result = await fetch(url);
            const data = await result.json();
            return data;
        } catch (error) {
            console.log(error);
            return error;
        }
    },
    replace_number_in_element: (contactElement, beforeText = '', afterText = '') => {
        if (contactElement) {
            const contactNumber = contactElement.innerHTML.replace(/[^0-9]/g, '');

            if (contacts.contactDict[contactNumber]) {
                contactElement.innerHTML = `${beforeText} ${contacts.contactDict[contactNumber]} ${afterText}`.trim();
            }
        }
    },
    replace_contact_number_to_name: (registered_contacts) => {
        // Verifica se as divs de busca de contato existem. Se sim, sai da função.
        if (document.querySelector('div[data-testid="search-no-chats-or-contacts"]') || document.querySelector('div[data-testid="searching-chats-contacts-messages"]')) {
            return;
        }
        // Valida se foi salvo os contatos
        if (!Object.keys(registered_contacts).length) {
            return;
        }

        // Dicionario com numeros e seus respectivos nomes
        registered_contacts.forEach(contact => {
            contacts.contactDict[contact.number] = contact.contact
        });

        // Arruma o nome na chat-list
        let conversationList = document.querySelector('[data-testid="chat-list"] > div');
        if (!conversationList) {
            conversationList = document.querySelector('[aria-label="Lista de conversas"] > div');
        }

        if (!conversationList) {
            conversationList = document.querySelector('[aria-label="Chat list"] > div');
        }

        if (!conversationList) {
            return;
        }

        if (!Object.keys(conversationList.childNodes).length) {
            return;
        }

        conversationList.childNodes.forEach(conversation => {
            const contact = conversation.querySelector('div > div > div > div > div > div > span > span');
            contacts.replace_number_in_element(contact);

        });

        if (contacts.observers.hasOwnProperty('fix_contact_name')) {
            return;
        }

        contacts.observers['fix_contact_name'] = new MutationObserver(() => {
            const contactConversationElement = document.querySelector('[data-testid="conversation-info-header-chat-title"]');
            const contactInfoElement = document.querySelector('#app > div > div > div > span > div > span > div > div > section > div > div > h2 > span');

            contacts.replace_number_in_element(contactConversationElement);
            contacts.replace_number_in_element(contactInfoElement);
        }).observe(document, {
            childList: true,
            subtree: true
        });
    },
};

// WTM communication
wtm = {
    wpp_qr_code: null,
    vds_info: null,
    panel: null,
    document: null,
    div_chat_list: null,
    iframe_chat_list: null,
    button_chat_list: null,
    disconnect_min_retry: 120000,
    last_disconnect: 0,
    timercount: 0,
    search_input: null,
    status_attempts: true,
    status_connection: null,
    erro_msg_attempts: null,
    count_attempts: 0,
    registered_contacts: {},
    search_for_contacts: {
        attempts: 0
    },
    wants_to_disconnect: true,
    observers: {},
    dark_mode: null,

    // Feature Flags Numbers
    maintenance_mode_flag: 2048,
    can_add_contact_flag: 4,
    can_dragndrop_flag: 8,
    can_send_audio_flag: 16,

    // Feature Flags
    check_flags: true,
    maintenance_mode: null,
    maintenance_mode_params: null,
    can_add_contacts: null,
    can_dragndrop: null,
    can_send_audio: null,
    blocked_extensions: [],

    is_flag_on: (flags, flag) => {
        return (flags & flag) !== 0;
    },

    reload_app: () => {
        if (_('#app').innerHTML == '') {
            _('#app').innerHTML = "<center><h2 style='margin: 20px'>Recarregue a página, ocorreu um erro interno do WhatsApp.</h2><button style='width: 150px;padding: 8px;background-color: #fe7b1d;border-radius: 5px;font-size: 16px;'type='button' id='reload'>Recarregar</button>";
            document.getElementById('reload').addEventListener('click', (_event) => { document.location.reload() });
        }
    },

    is_json: (str) => {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    },

    check_for_landing: () => {
        let landing = _('div.landing-main');
        if (landing) {
            let aside = landing.querySelector('aside');
            if (aside) {
                aside.remove();
            }
            // look for the timeout.
            if (_(landing, 'button')) {
                return 'TIMEOUT';
            }

            else if (!!wtm.read_barcode()) {
                return 'BARCODE';
            }
        }
        return 'unknown';
    },

    read_barcode: () => {
        let bc = _('img[alt="Scan me!"');

        if (!bc) {
            canvas = true;
            bc = _('canvas[aria-label="Scan me!"') || _('canvas[aria-label="Scan this QR code to link a device!"');
        }

        if (bc) {
            // check if the code is still valid.
            let span = _(bc.parentNode, 'span');
            if (!span || !span.firstChild) {
                if (!canvas) {
                    return bc.src;
                } else {
                    return bc.toDataURL('image/png');
                }
            }
        }
        return null;
    },

    check_for_disconnection: () => {
        let disc = _('span[data-testid=alert-phone]');
        return disc != null;
    },

    valid_number_reg: (number, reg) => {
        let numberRegex = reg;
        return numberRegex.test(number);
    },

    modify_version: () => {
        let version_text = _(".version");

        if (version_text) {
            if (version_text.innerHTML != g_app_version) {
                version_text.innerHTML = g_app_version;
            }
        }
    },

    open_wtm_login: () => {
        // do not create the form thice.
        if (wtm.panel != null) {
            return;
        }

        if (browserTitle) {
            ipcRenderer.send('removeTrayNumber', [browserTitle, config.params(browserTitle).get('phone_number')]);
        }
        config.params(browserTitle).set('phone_number', '');
        config.params(browserTitle).set('vd_key', '');
        config.params(browserTitle).set('version', '');

        wtm.panel = document.createElement('div');
        wtm.panel.id = 'wtm-activate-whastapp';
        wtm.panel.style.cssText = 'position: fixed; top: 0; left: 0; bottom: 0; right: 0; background-color: white; z-index: 999; text-align: center';
        if (wtm) {
            wtm.panel.innerHTML = fs.readFileSync(path.join(__dirname, '..', 'html', 'form-activation.html'));
            theme_handler.theme_selector(wtm.panel.children[1], wtm.dark_mode);
        }

        _(wtm.panel, '#wtmwsp_submit').addEventListener('click', (_event) => {
            if (!!wtm.read_barcode()) {
                _(wtm.panel, '#wtmwsp_submit').setAttribute('disabled', 'disabled');
                _(wtm.panel, 'input[name=vd_number]').value = number = _(wtm.panel, 'input[name=vd_number]').value.replace(/\s/g, '');
                _(wtm.panel, 'input[name=vd_key]').value = key_value = _(wtm.panel, 'input[name=vd_key]').value.replace(/\s/g, '').toUpperCase();

                let accounts = config.params(100).get('open_accounts');
                let existingNumber = accounts.find((item) => item.phone_number === number);
                let existingWindow = accounts.find((item) => item.windowTitle === browserTitle);

                if (existingNumber && !existingWindow) {
                    wtm.report_error("Telefone já está conectado, verifique a lista de Contas Conectadas");
                    return;
                }

                if (number && key_value) {
                    if (!wtm.valid_number_reg(number, /^\d+$/)) {
                        wtm.report_error("Telefone ou chave de ativação inválido, tente novamente");
                        return;
                    }
                    if (!wtm.valid_number_reg(key_value, /[0-9^A-Z]/)) {
                        wtm.report_error("Telefone ou chave de ativação inválido, tente novamente");
                        return;
                    }
                } else {
                    wtm.report_error("Verifique se os campos estão preenchidos");
                    return;
                }

                // try to login
                if (!number || !key_value) {
                    return;
                }

                wtm.getinstance(number, key_value, false);
            }
        });

        document.lastChild.appendChild(wtm.panel);
        _(wtm.panel, 'input[name=vd_number]').focus();
    },

    open_report_bug_page: () => {
        // do not create the form thice.
        if (wtm.report_bug != null) {
            return;
        }

        wtm.report_bug = document.createElement('div');
        wtm.report_bug.id = 'wtm-report-bug';
        wtm.report_bug.style.cssText = 'position: fixed; top: 0; left: 0; bottom: 0; right: 0; background-color: white; z-index: 999; text-align: center';
        if (wtm) {
            wtm.report_bug.innerHTML = fs.readFileSync(path.join(__dirname, '..', 'html', 'report-bug.html'));
            theme_handler.theme_selector(wtm.report_bug.children[1], wtm.dark_mode);
        }
        document.lastChild.appendChild(wtm.report_bug);
        document.getElementById("restart-app").addEventListener('click', () => {
            location.reload(true);
        })
    },


    close_wtm_panel: () => {
        if (wtm.panel) {
            wtm.panel.remove();
            wtm.panel = null;
            wtm.count_attempts = 0;
        }
    },

    open_contact_panel: () => {
        wtm.contact = document.createElement('div');
        wtm.contact.id = 'wtm-add-contact';
        wtm.contact.style.cssText = 'position: fixed; top: 0; left: 0; bottom: 0; right: 0; background-color: white; z-index: 999; text-align: center';
        wtm.contact.innerHTML = fs.readFileSync(path.join(__dirname, '..', 'html', 'form-contact.html'));
        theme_handler.theme_selector(wtm.contact.children[1], wtm.dark_mode);

        _(wtm.contact, '#contact_submit').addEventListener('click', (_evt) => { wtm.register_contact(); return false; });
        _(wtm.contact, '#contact_back').addEventListener('click', (_evt) => { wtm.close_contact_panel(); return false; });
        _(wtm.contact, '#contact_chat').addEventListener('click', (_evt) => {
            let phone = _(wtm.contact, '#contact_phone').value;
            if (!phone) {
                _(wtm.contact, 'p.error').innerHTML = 'Entre com o telefone do contato';
                _(wtm.contact, 'p.error').style.display = '';
                return;
            }
            if (isNaN(phone) || phone.length < 6) {
                _(wtm.contact, 'p.error').innerHTML = 'Número de telefone inválido';
                _(wtm.contact, 'p.error').style.display = '';
                return;
            }

            window.location = 'https://web.whatsapp.com/send?phone=' + phone + '&text&app_absent=0';
        });
        _(wtm.contact, '#contact_close').addEventListener('click', (_evt) => { wtm.close_contact_panel(); return false; });

        document.lastChild.appendChild(wtm.contact);
        _(wtm.contact, '#contact_name').focus();
    },

    close_contact_panel: () => {
        if (wtm.contact) {
            wtm.contact.remove();
            wtm.contact = null;
        }
    },

    open_maintenance_mode: (title, message) => {
        wtm.maintenance_mode = document.createElement('div');
        wtm.maintenance_mode.id = 'wtm-maintenance-mode';
        wtm.maintenance_mode.style.cssText = 'position: fixed; top: 0; left: 0; bottom: 0; right: 0; background-color: white; z-index: 999; text-align: center';
        wtm.maintenance_mode.innerHTML = fs.readFileSync(path.join(__dirname, '..', 'html', 'maintenance-mode.html'));
        theme_handler.theme_selector(wtm.maintenance_mode.children[1], wtm.dark_mode);

        _(wtm.maintenance_mode, '#maintenance-title').innerHTML = title;
        _(wtm.maintenance_mode, '#maintenance-msg').innerHTML = message;

        document.lastChild.appendChild(wtm.maintenance_mode);
    },

    register_contact: () => {
        _(wtm.contact, 'p.error').style.display = 'none';
        _(wtm.contact, '#contact_submit').setAttribute('disabled', 'disabled');

        let data = new FormData(_(wtm.contact, 'form'));
        data.append('vd_number', config.params(browserTitle).get('phone_number'));
        data.append('vd_key', config.params(browserTitle).get('act_token'));

        fetch(`${config.session.base_url}?cmd=regcontact`, { method: 'POST', body: data })
            .then(response => response.text())
            .then(value => {
                obj = JSON.parse(value);
                if (obj.success) {
                    _(wtm.contact, 'form').style.display = 'none';
                    _(wtm.contact, '#show_success').style.display = '';
                }
                else throw obj.message;
            })
            .catch(err => {
                _(wtm.contact, 'p.error').innerHTML = err;
                _(wtm.contact, 'p.error').style.display = '';
                _(wtm.contact, '#contact_submit').removeAttribute('disabled');
            })
    },

    getinstance: (number, key, already_connected) => {
        if (!number || !key) {
            return;
        }

        if (!already_connected) {
            wtm.report_status('Contactando ' + config.cluster + '...');
        }

        config.params(browserTitle).set('cluster', config.cluster);

        const data = {
            vd_key: key,
            vd_number: number,
        };

        const controller = new AbortController();

        timeout = setTimeout(() => {
            controller.abort('timeout');
            wtm.report_error('Não foi possível realizar o login, contate o suporte');
        }, 120000);

        const options = {
            method: "POST",
            body: JSON.stringify(data),
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
        };

        fetch(`https://${config.cluster}/instance`, options)
            .then(response => response.json())
            .then(value => {
                wtm.vds_info = value;

                clearTimeout(timeout);

                if (value.vd_status != 4) {
                    wtm.report_error('Este telefone não está pronto para ser usado. Contate o suporte');
                    wtm.status_connection = null;
                }

                wtm.maintenance_mode = wtm.is_flag_on(value.feature_flags, wtm.maintenance_mode_flag);
                wtm.can_add_contacts = wtm.is_flag_on(value.feature_flags, wtm.can_add_contact_flag);
                wtm.can_dragndrop = wtm.is_flag_on(value.feature_flags, wtm.can_dragndrop_flag);
                wtm.can_send_audio = wtm.is_flag_on(value.feature_flags, wtm.can_send_audio_flag);
                wtm.blocked_extensions = value.blocked_extensions;

                // Saving config file
                config.params(browserTitle).set('send_attachments', wtm.can_dragndrop);
                config.params(browserTitle).set('send_audio', wtm.can_send_audio);
                config.params(browserTitle).set('add_contacts', wtm.can_add_contacts);

                config.params(browserTitle).set('vd_key', key);
                config.params(browserTitle).set('phone_number', number);
                config.params(browserTitle).set('act_token', wtm.vds_info['activation_token']);
                config.params(browserTitle).set('version', wtm.vds_info['inst_version']);

                config.session.worker_frontend = wtm.vds_info['worker_frontend'];
                config.session.base_url = `https://${wtm.vds_info['worker_frontend']}${wtm.vds_info['service_uri']}`;
                // Status update
                wtm.report_status('Estamos estabelecendo uma conexão...');
                _(wtm.panel, 'input[name=qr_code]').value = wtm.qr_code;
                return fetch(config.session.base_url, {
                    method: 'POST',
                    body: new FormData(_(wtm.panel, 'form'))
                });
            })
            .then(response => response.text())
            .then(text => {
                textReturn = text.split("\n")

                // verify is json and report message error or success
                if (wtm.is_json(textReturn)) {
                    obj = JSON.parse(textReturn)
                    wtm.status_attempts = obj.success;

                    // set status connection 
                    (wtm.status_attempts == false) ? wtm.status_connection = null : wtm.status_connection;
                    if (wtm.status_attempts == false && obj.message) {
                        wtm.report_error(obj.message);
                    }
                    else if (obj.message) {
                        wtm.report_status(obj.message);
                    }

                    wtm.erro_msg_attempts = obj.message;

                } else if (textReturn != null) {
                    wtm.report_error(textReturn);
                    wtm.erro_msg_attempts = textReturn;
                }
            })
            .catch(err => {
                switch (err.name) {
                    case "AbortError":
                        err = 'Não foi possível realizar o login, contate o suporte';
                        wtm.erro_msg_attempts = err;
                        wtm.status_attempts = false;
                        wtm.status_connection = null;
                        break;
                };

                wtm.report_error(err)
            });
    },

    report_error: (error) => {
        let err = _(wtm.panel, '.error');
        if (err) {
            err.innerHTML = error;
            err.style.display = '';
            _(wtm.panel, '.loading').style.display = 'none';
            _(wtm.panel, '#wtmwsp_submit').removeAttribute('disabled')
        }
    },

    report_status: (msg) => {
        let status = _(wtm.panel, '.loading');
        if (status) {
            status.style.display = '';
            status.innerHTML = msg;
            _(wtm.panel, '.error').style.display = 'none';
            localStorage.setItem('__wtm_number', _(wtm.panel, 'input[name=vd_number]').value);
        }
    },

    dragndrop_handler: (e) => {
        switch (e.type) {

            case 'dragenter':
                //stop the event chain
                e.stopPropagation();
                break;

            case 'drop':
                // the above did not prevent some types of drops
                // so, we'll keep this here just in case.
                e.stopPropagation();
                ipcRenderer.invoke('open-dialog', {
                    title: 'Aviso',
                    type: 'warning',
                    buttons: ['OK'],
                    message: 'Esta operação foi bloqueada pelo administrador.'
                });
                break;

            default:
                break;
        }
    },

    create_button: (parent_div) => {
        const container = document.createElement('div');
        container.classList.add('buttons-container');
        container.style.cssText = 'z-index: 100; bottom: 0; border-top: 4px solid #fe7b1d; left: 0; right: 0; height: 40px; text-align: center; padding: 15px 0; display: flex; justify-content: center;';

        if (wtm.dark_mode) {
            container.style.cssText += 'background: #0e141a;';
        } else {
            container.style.cssText += 'background: #f5f5f5;';
        }

        container.innerHTML = fs.readFileSync(path.join(__dirname, '..', 'html', 'buttons-container.html'));

        _(container, '#add-contact-icon').addEventListener('click', () => { wtm.open_contact_panel(); });

        parent_div.appendChild(container);
    },

    create_chat_list_link: (div) => {
        const container = document.createElement('a');
        container.classList.add('chat-list-link');
        container.style.cssText = 'z-index: 100; font: inherit; vertical-align: initial; outline: none; padding: .4rem; margin: 0; border: 0; font-size: 14px; font-weight: 500; line-height: 20px; color: #667781; cursor: pointer;';
        container.innerText = 'Clique aqui para procurar mensagens mais antigas.',

            container.addEventListener('click', () => { wtm.open_chat_list_panel() });

        div.appendChild(container);
    },

    open_disconnect_prompt: () => {
        if (wtm.prompt) {
            return;
        }
        wtm.prompt = document.createElement('div');
        wtm.prompt.id = 'wtm-disconnect';
        wtm.prompt.style.cssText = 'position: fixed; top: 0; left: 0; bottom: 0; right: 0; background-color: white; z-index: 999; text-align: center';
        wtm.prompt.innerHTML = fs.readFileSync(path.join(__dirname, '..', 'html', 'disconnect-prompt.html'));
        theme_handler.theme_selector(wtm.prompt.children[1], wtm.dark_mode);

        _(wtm.prompt, '#wtmwsp_yes').addEventListener('click', (_evt) => { wtm.disconnect_from_wpp_web(); return false; });
        _(wtm.prompt, '#wtmwsp_no').addEventListener('click', (_evt) => { wtm.close_prompt(); wtm.wants_to_disconnect = false; return false; });

        document.lastChild.appendChild(wtm.prompt);
    },

    close_prompt: () => {
        if (wtm.prompt) {
            wtm.prompt.remove();
            wtm.prompt = null;
        }
    },

    disconnect_from_wpp_web: async () => {
        var lang = document.documentElement.lang;

        if (lang == 'en') {
            // 3 dots menu
            const menu = _(app, '[aria-label="Menu"]');
            menu.click();

            await new Promise(resolve => setTimeout(resolve, 100));
            const logOutButton = _('[aria-label="Log out"]');
            logOutButton.click();

            await new Promise(resolve => setTimeout(resolve, 100));
            const logOutOK = _('[aria-label="Log out?"] button:nth-child(2)');
            logOutOK.click();
        } else if (lang == 'pt-BR') {
            // 3 dots menu
            const menu = _(app, '[aria-label="Mais opções"]');
            menu.click();

            await new Promise(resolve => setTimeout(resolve, 100));
            const logOutButton = _('[aria-label="Desconectar"]');
            logOutButton.click();

            await new Promise(resolve => setTimeout(resolve, 100));
            const logOutOK = _('[aria-label="Deseja desconectar?"] button:nth-child(2)');
            logOutOK.click();
        }

    },

    ontimer: async () => {
        // check for login
        const wppLoginSuccess = localStorage.getItem('me-display-name');
        if (wppLoginSuccess) {
            wtm.close_wtm_panel()
        }

        wtm.reload_app();
        wtm.timercount++
        wtm.modify_version();

        // theme check
        wtm.dark_mode = theme_handler.init();

        if (!browserTitle) {
            await new Promise(resolve => setTimeout(resolve, 10));
            document.location.reload();
        }

        if (!document.title.includes("(")) {
            let number = config.params(browserTitle).get('phone_number');
            let title = `Intelitrader WTM - Não logado - ${g_app_version}`
            if (number) {
                title = `Intelitrader WTM - ${number} - ${g_app_version}`
            }
            document.title = title;
        };

        // section where the chat list is
        let side = _('div#side');

        // A cada três segundos ele entra no if.
        // O timercount incrementa a cada 300 millisegundos.
        if ((wtm.timercount % 10) == 0) {
            if (wtm.check_for_disconnection()) {
                let now = Date.now();
                if (wtm.last_disconnect + wtm.disconnect_min_retry > now) {
                    return;
                }
                wtm.last_disconnect = now;

                // let the main window know, in case it needs to play a sound.
                ipcRenderer.send('x-disconnected', 'nada');

                // connect and "bump"
                let data = new FormData;
                data.append('vd_number', config.params(browserTitle).get('phone_number'));
                fetch(`${config.session.base_url}?cmd=reconnect`, { method: 'POST', body: data });
            }

            if (!config.session.base_url) {
                const number = config.params(browserTitle).get('phone_number');
                const key = config.params(browserTitle).get('vd_key');
                wtm.getinstance(number, key, true);
            }

            if (side) {
                // if login was successful, we'll add the number as well
                if (browserTitle) {
                    ipcRenderer.send('changeTrayNumber', [browserTitle, wtm.vds_info['vd_number']]);
                }

                if (config.params(browserTitle).get('vd_key') == '' && wtm.wants_to_disconnect == true) {
                    wtm.open_disconnect_prompt();
                }
                contacts.replace_contact_number_to_name(wtm.registered_contacts);

                // Check if the user can add contacts
                if (wtm.can_add_contacts) {
                    const add_contact_button = _('button#add-contact-icon');
                    if (!add_contact_button) {
                        wtm.create_button(side);
                    }
                } else {
                    const container = _(side, '.buttons-container');
                    if (container) {
                        side.removeChild(container);
                    }
                }

                contacts.insert_contacts(side, wtm.registered_contacts, wtm.search_for_contacts);
            } else {
                wtm.dragAndDrop_disabled = false;
            }
        }

        // section when chat is open
        let chat_box = _('#main');

        if (chat_box && wtm.timercount % 2) {
            // div where the messages list are
            let messages_panel = chat_box.querySelector('[role="application"]');

            let messages = messages_panel.querySelectorAll('[role="row"]');

            messages.forEach(message => {
                if (button = message.querySelector("[role=button]")) {
                    // this is to avoid getting the button of a video file that shows as embedded.
                    if (button.title != '') {
                        // splits the title following an assumed pattern of '<Language's word for download> <Whitespace> <Double quotes> <File name with extension> <Double quotes>'.
                        // the replace is needed because in English the title attribute uses curly double quotes instead of straight double quotes like in Portuguese.
                        // this can potentially be a problem if the user's OS locale uses a language with different characters for quotes.
                        let title = button.title.split(/^\S*\s/)[1].replace(/^“|”$/g, '"').toLowerCase();

                        let re = wtm.blocked_extensions;

                        function checkExtensions(mainString, arrayDeStrings) {
                            for (const searchString of arrayDeStrings) {
                                if (mainString.includes(searchString)) {
                                    return true;
                                }
                            }
                            return false;
                        }

                        if (re && checkExtensions(title, wtm.blocked_extensions)) {
                            button.style.pointerEvents = 'none';
                            for (const child of button.parentElement.parentElement.children) {
                                child.style.cursor = "not-allowed";
                            }
                        } else {
                            button.style.pointerEvents = 'auto';
                            for (const child of button.parentElement.parentElement.children) {
                                child.style.cursor = "auto";
                            }
                        }
                    }
                }
            });
        }

        // every 5 minutes check for feature flags and connection status
        if (side && (wtm.check_flags || (wtm.timercount % 1000 == 0))) {
            wtm.check_flags = false;

            const data = {
                vd_key: config.params(browserTitle).get('vd_key'),
                vd_number: config.params(browserTitle).get('phone_number'),
            };

            const options = {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json; charset=utf-8"
                },
            };

            fetch(`https://${config.cluster}/instance`, options)
                .then(response => response.json())
                .then(value => {
                    switch (value.vd_status) {
                        case 4:
                        case 260:
                        case 256:
                            break;
                        default:
                            wtm.disconnect_from_wpp_web();
                    }

                    wtm.maintenance_mode = wtm.is_flag_on(value.feature_flags, wtm.maintenance_mode_flag);
                    wtm.can_add_contacts = wtm.is_flag_on(value.feature_flags, wtm.can_add_contact_flag);
                    wtm.can_dragndrop = wtm.is_flag_on(value.feature_flags, wtm.can_dragndrop_flag);
                    wtm.can_send_audio = wtm.is_flag_on(value.feature_flags, wtm.can_send_audio_flag);

                    wtm.blocked_extensions = value.blocked_extensions;
                    wtm.maintenance_mode_params = value.maintenance_mode;

                    config.params(browserTitle).set('send_attachments', wtm.can_dragndrop);
                    config.params(browserTitle).set('send_audio', wtm.can_send_audio);
                    config.params(browserTitle).set('add_contacts', wtm.can_add_contacts);

                    // Check if can send attachments
                    if (wtm.can_dragndrop) {
                        let style = document.createElement('style');
                        style.innerHTML = '#main > footer > div > div > span > div > div > div > div > div:has(div>span[data-icon="plus"]){display: inherit}';
                        style.innerHTML += '#main > footer > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div > div > div > div > div > div:nth-child(1) > div > span > button{display: inherit}'
                        document.head.appendChild(style);

                        document.removeEventListener('drop', wtm.dragndrop_handler, { capture: true });
                        document.removeEventListener('dragenter', wtm.dragndrop_handler, { capture: true });

                    } else {
                        let style = document.createElement('style');
                        style.innerHTML = '#main > footer > div > div > span > div > div > div > div > div:has(div>span[data-icon="plus"]){display: none}';
                        style.innerHTML += '#main > footer > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div > div > div > div > div > div:nth-child(1) > div > span > button{display: none}'
                        document.head.appendChild(style);

                        document.addEventListener('drop', wtm.dragndrop_handler, { capture: true });
                        document.addEventListener('dragenter', wtm.dragndrop_handler, { capture: true });
                    }

                    // Check if can send audio
                    if (wtm.can_send_audio) {
                        let style = document.createElement('style');
                        style.innerHTML = '#main > footer > div > div > span > div > div > div > button:has(span[data-icon="ptt"]){display: inherit}';
                        document.head.appendChild(style);
                    } else {
                        let style = document.createElement('style');
                        style.innerHTML = '#main > footer > div > div > span > div > div > div > button:has(span[data-icon="ptt"]){display: none}';
                        document.head.appendChild(style);
                    }

                    // Check if maintenance mode is on
                    if (wtm.maintenance_mode) {
                        const container = _('#wtm-maintenance-mode');
                        const titleText = wtm.maintenance_mode_params.title;
                        const msgText = wtm.maintenance_mode_params.msg;

                        if (!container) {
                            wtm.open_maintenance_mode(titleText, msgText);
                        } else {
                            const msg = _(container, '#maintenance-msg')
                            const title = _(container, '#maintenance-title')

                            if (msg.innerHTML != msgText) {
                                msg.innerHTML = msgText
                            }

                            if (title.innerHTML != titleText) {
                                title.innerHTML = titleText
                            }
                        }
                    } else {
                        const container = _('#wtm-maintenance-mode')
                        if (container) {
                            container.remove();
                        }
                    }
                })
                .catch(error => {
                    console.log(error);
                })
        }

        if ((wtm.timercount % 1000) == 0 || wtm.timercount == 2) {
            // Fetch the corresponding device's registered contacts (in the portal, not the device itself).
            wtm.registered_contacts = await contacts.fetch_registered_contacts('https://wtm.intelitrader.com.br/wsvc/getcontacts.php?vd_number=' + config.params(browserTitle).get('phone_number') + '&vd_key=' + config.params(browserTitle).get('vd_key'));
        }

        let log_out = _('#app > div > span:nth-child(2) > div > div > div > div > div > div > div:nth-child(3) > div > div:nth-child(2)');

        if (log_out) {
            log_out.addEventListener('click', (_event) => {
                config.cleanStoreData(browserTitle);
            });
        }

        if (side) {
            const label_info = _('#side .selectable-text > span');
            const chat_list_link = _('.chat-list-link');

            if (!chat_list_link) {
                wtm.create_chat_list_link(side);
            } else if (label_info) {
                chat_list_link.style.display = "block";
            } else {
                chat_list_link.style.display = "none";
            }
        }
    },

    init: (doc) => {
        wtm.document = doc;
        wtm.ontimer();
        setInterval(wtm.ontimer, 300);
    },

    // fetch_wtm_chats: view_old_chats.fetch_wtm_chats,
    // fetch_participants: view_old_chats.fetch_participants,
    // fetch_chat_content: view_old_chats.fetch_chat_content,
    // open_chat_list_panel: view_old_chats.open_chat_list_panel,
    // close_chat_list_panel: view_old_chats.close_chat_list_panel,
    // open_chat_list: view_old_chats.open_chat_list,
    // format_duration: view_old_chats.format_duration,
    // format_start_time: view_old_chats.format_start_time,
    // format_participant: view_old_chats.format_participant,
    // next_chat_btn: view_old_chats.next_chat_btn,
    // previus_chat_btn: view_old_chats.previus_chat_btn,
    // fill_table: view_old_chats.fill_table,
    // close_chat_list: view_old_chats.close_chat_list,
    // format_message_timestamp: view_old_chats.format_message_timestamp,
    // close_modal: view_old_chats.close_modal,
    // open_modal: view_old_chats.open_modal,
    // add_download_button: view_old_chats.add_download_button,
    // media_download: view_old_chats.media_download,
    // fill_messages_container: view_old_chats.fill_messages_container,
    // open_chat_view: view_old_chats.open_chat_view,
    // close_chat_view: view_old_chats.close_chat_view,
}

wtm.init(document);

//module.exports = wtm;
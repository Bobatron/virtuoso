export interface TemplateField {
    key: string;
    label: string;
    placeholder: string;
    defaultValue?: string;
}

export interface StanzaTemplate {
    name: string;
    description: string;
    xml: string;
    fields?: TemplateField[];
}

export const STANZA_TEMPLATES: StanzaTemplate[] = [
    {
        name: 'Presence (Online)',
        description: 'Set status to online/available',
        xml: '<presence/>',
        fields: []
    },
    {
        name: 'Presence (Away)',
        description: 'Set status to away',
        xml: '<presence>\n  <show>away</show>\n  <status>{status}</status>\n</presence>',
        fields: []
    },
    {
        name: 'Chat Message',
        description: 'Send a simple chat message',
        xml: '<message to="{to}" type="chat">\n  <body>{body}</body>\n</message>',
        fields: []
    },
    {
        name: 'Groupchat Message',
        description: 'Send a message to a MUC room',
        xml: '<message to="{to}" type="groupchat">\n  <body>{body}</body>\n</message>',
        fields: []
    },
    {
        name: 'IQ Version',
        description: 'Query software version',
        xml: '<iq type="get" id="{id}" to="{to}">\n  <query xmlns="jabber:iq:version"/>\n</iq>',
        fields: []
    },
    {
        name: 'IQ Ping',
        description: 'Send a ping to check connectivity',
        xml: '<iq type="get" id="{id}" to="{to}">\n  <ping xmlns="urn:xmpp:ping"/>\n</iq>',
        fields: []
    },
    {
        name: 'Service Discovery (Info)',
        description: 'Discover features of an entity',
        xml: '<iq type="get" id="{id}" to="{to}">\n  <query xmlns="http://jabber.org/protocol/disco#info"/>\n</iq>',
        fields: []
    },
    {
        name: 'Service Discovery (Items)',
        description: 'Discover items/nodes of an entity',
        xml: '<iq type="get" id="{id}" to="{to}">\n  <query xmlns="http://jabber.org/protocol/disco#items"/>\n</iq>',
        fields: []
    }
];

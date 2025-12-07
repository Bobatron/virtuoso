export interface StanzaTemplate {
    name: string;
    description: string;
    xml: string;
}

export const STANZA_TEMPLATES: StanzaTemplate[] = [
    {
        name: 'Presence (Online)',
        description: 'Set status to online/available',
        xml: '<presence/>'
    },
    {
        name: 'Presence (Away)',
        description: 'Set status to away',
        xml: '<presence>\n  <show>away</show>\n  <status>I am away</status>\n</presence>'
    },
    {
        name: 'Chat Message',
        description: 'Send a simple chat message',
        xml: '<message to="user@domain.com" type="chat">\n  <body>Hello World!</body>\n</message>'
    },
    {
        name: 'Groupchat Message',
        description: 'Send a message to a MUC room',
        xml: '<message to="room@conference.domain.com" type="groupchat">\n  <body>Hello Room!</body>\n</message>'
    },
    {
        name: 'IQ Version',
        description: 'Query software version',
        xml: '<iq type="get" id="version_1" to="domain.com">\n  <query xmlns="jabber:iq:version"/>\n</iq>'
    },
    {
        name: 'IQ Ping',
        description: 'Send a ping to check connectivity',
        xml: '<iq type="get" id="ping_1" to="domain.com">\n  <ping xmlns="urn:xmpp:ping"/>\n</iq>'
    },
    {
        name: 'Service Discovery (Info)',
        description: 'Discover features of an entity',
        xml: '<iq type="get" id="disco_1" to="domain.com">\n  <query xmlns="http://jabber.org/protocol/disco#info"/>\n</iq>'
    },
    {
        name: 'Service Discovery (Items)',
        description: 'Discover items/nodes of an entity',
        xml: '<iq type="get" id="disco_2" to="domain.com">\n  <query xmlns="http://jabber.org/protocol/disco#items"/>\n</iq>'
    }
];

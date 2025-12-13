- placeholders is not what I expected.

I want users to be able to add a placeholder into a stanza message in the input field:
{{example}}

The app will see there is a placeholder and automatically create a template parameter that can be completed to fill that placeholder

But if the value given is ${id-test} - or something better named. Then when the message is sent an id will be generated and can later be reference by label test

For example

<iq type="get" id="{id}" to="{to}">
  <ping xmlns="urn:xmpp:ping"/>
</iq>

Would result in parameters being displayed in the UI
- id 
- to

If a user sets the values to:
- id: 1234
- to: bob@localhost/virtuoso

then both values are set statically 

but 
If a user sets the values to:
- id: ${id-test}
- to: bob@localhost/virtuoso

Then the id is set dynamically and the id generated is stored with label 'test'

that way if stanza responses is returned that I want to assert on later on, I can configure the assertion to say is should contain the id with label test
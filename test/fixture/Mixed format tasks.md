This file demonstrates that the plugin supports both emoji and Dataview formats for task IDs and dependencies.

## Emoji Format (Original)

- [x] Define what to do #example #project 🆔 abc123
- [x] List resources #example 🆔 def456
- [/] Start work #example #new ⛔ abc123 ⛔ def456 🆔 ghi789
- [ ] Check progress #example #easy ⛔ ghi789,def456

## Dataview Format (New)

- [ ] Design architecture #dataview  [[id:: 7f3yaw]]
- [ ] Implement feature #dataview  [[dependsOn:: 7f3yaw]] [[id:: jmhi6u]]
- [ ] Write tests #dataview  [[dependsOn:: jmhi6u]] [[id:: i2a0b2]]
- [ ] Deploy to production #dataview  [[dependsOn:: jmhi6u, i2a0b2]]

## Mixed Format (Both Styles)

You can even mix both styles in the same vault (though not recommended in the same task):

- [ ] Task with emoji ID #mixed 🆔 mno345
- [ ] Task with dataview dependency #mixed [[dependsOn:: mno345]]

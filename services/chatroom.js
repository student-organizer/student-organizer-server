module.exports.Chatroom = class
{
    constructor(timestamp, members, messages, name, id)
    {
        this.timestamp = timestamp;
        this.members = members;
        this.messages = messages;
        this.name = name;
        this.id = id;
    }

    addMember(member)
    {
        this.members.push(member);
    }

    removeMember(member)
    {
        var new_members = [];
        for (var i = 0; i < this.members.length(); i++)
        {
            if (this.members[i] != member)
                new_members.push(this.members[i]);
        }

        this.members = new_members;
    }

    addMessage(msg)
    {
        this.messages.push(msg);
    }
}
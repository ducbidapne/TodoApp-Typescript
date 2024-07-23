import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userSchema = new Schema({
  assignee: {
    type: String,
    required: true,
  },
  task: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
});

const User = mongoose.model('User', userSchema);

export default User;

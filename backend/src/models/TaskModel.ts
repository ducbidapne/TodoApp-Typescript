import * as mongoose from 'mongoose';
import { TaskStatus } from '../common/enum/task-status.enum';
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    enum: TaskStatus,
    required: true
  },
  create_at: { type: Date, default: Date.now() },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Task = mongoose.model('Task', taskSchema);

export default Task;

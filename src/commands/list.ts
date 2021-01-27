import { Command, Option } from 'clipanion';

export default class ListCommand extends Command {
  static paths = [['list']];
  name = Option.String({ required: false });

  async execute(): Promise<void> {
    this.context.stdout.write('list');
  }
}

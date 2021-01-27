import { Command, Option } from 'clipanion';

export default class ScaleCommand extends Command {
  static paths = [['scale']];
  name = Option.String({ required: false });

  async execute(): Promise<void> {
    this.context.stdout.write('scale');
  }
}

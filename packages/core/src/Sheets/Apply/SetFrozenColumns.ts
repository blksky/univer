import { Worksheet } from '../Domain/Worksheet';

/**
 *
 * @param worksheet
 * @param numColumns
 * @returns
 *
 * @internal
 */
export function SetFrozenColumns(worksheet: Worksheet, numColumns: number): number {
    // get config
    const config = worksheet.getConfig();

    // store old sheet name
    const oldStatus = config.freezeColumn;

    // set new sheet name
    config.freezeColumn = numColumns;

    // return old sheet name to undo
    return oldStatus;
}

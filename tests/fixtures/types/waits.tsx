/** Declarations of 0.34.0's React waits (D183): a chooser that waits for an earlier choice and a held Send's place. */
import { ChoiceMenu, ChoiceChip, Composer } from '@beyond-js/ui/react';

const earlier = () => document.querySelector<HTMLElement>('#repository');
export const chip = <ChoiceChip label="Branch" options={[{ value: 'main', label: 'main' }]} waiting place={earlier} />;
export const menu = <ChoiceMenu label="Branch" options={[{ value: 'main', label: 'main' }]} waiting={false} place={null} />;
export const composer = <Composer label="Message" onSubmit={() => undefined} disabled={{ reason: 'Choose a machine first.', place: earlier }} />;
// @ts-expect-error a place is a function that returns an element
export const wrong = <ChoiceChip label="Branch" options={[]} place={document.body} />;

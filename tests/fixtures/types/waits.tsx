/** Declarations of 0.34.0's React waits (D183): a chooser that waits for an earlier choice, a held Send's place and Form's `report`. */
import { ChoiceMenu, ChoiceChip, Composer, Form } from '@beyond-js/ui/react';

const earlier = () => document.querySelector<HTMLElement>('#repository');
export const chip = <ChoiceChip label="Branch" options={[{ value: 'main', label: 'main' }]} waiting place={earlier} />;
export const menu = <ChoiceMenu label="Branch" options={[{ value: 'main', label: 'main' }]} waiting={false} place={null} />;
export const composer = <Composer label="Message" onSubmit={() => undefined} disabled={{ reason: 'Choose a machine first.', place: earlier }} />;
// @ts-expect-error a place is a function that returns an element
export const wrong = <ChoiceChip label="Branch" options={[]} place={document.body} />;
export const reporting = <Form report onSubmit={event => event.preventDefault()}><input type="email" aria-label="Email" /></Form>;
export const quiet = <Form report={false} />;
// @ts-expect-error report is a yes or no
export const loud = <Form report="always" />;

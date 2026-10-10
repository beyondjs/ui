/** Declarations of 0.12.0's rail in React. */
import { Rail, RailItem, RailMoment } from '@beyond-js/ui/react';

export const view = (
	<Rail label="Work">
		<RailItem glyph="clock" tone="progress">
			<span>Thought for 9 s</span>
		</RailItem>
		<RailMoment text="10:51" datetime="2026-10-09T10:51:00Z" />
	</Rail>
);

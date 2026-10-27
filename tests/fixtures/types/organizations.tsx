// React's OrganizationMark (0.40.0, D195), compiled by `npm run types`.
import { OrganizationMark } from '@beyond-js/ui/react';

export const marks = [<OrganizationMark key="a" name="Tienda Willy" logo="https://accounts.example.test/v1/logos/k1" />, <OrganizationMark key="b" name="Northwind" />];

// @ts-expect-error a mark needs the organization's name
export const nameless = <OrganizationMark logo={null} />;

import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import { Switch } from '@strapi/design-system';

const RepeatSwitch = () => {
  const { form } = useContentManagerContext() as any;
  const { values, onChange } = form;

  const checked = values?.repeat ?? false;

  return (
    <Switch
      label="Repeat daily"
      onLabel="Yes"
      offLabel="No"
      checked={checked}
      onChange={(e: any) =>
        onChange({ target: { name: 'repeat', value: e.target.checked } })
      }
    />
  );
};

export { RepeatSwitch };

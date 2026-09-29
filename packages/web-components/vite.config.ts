import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@aolmosn/core',
        replacement: resolve(__dirname, '../core/src/index.ts'),
      },
      {
        find: /^@design-lib\/tokens(.*)/,
        replacement: resolve(__dirname, '../tokens/src$1'),
      },
    ],
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'radio-button': resolve(__dirname, 'src/components/radio-button/index.ts'),
        button: resolve(__dirname, 'src/components/button/index.ts'),
        alert: resolve(__dirname, 'src/components/alert/index.ts'),
        'check-box': resolve(__dirname, 'src/components/check-box/index.ts'),
        'text-input': resolve(__dirname, 'src/components/text-input/index.ts'),
        'kebab-container': resolve(__dirname, 'src/components/kebab/index.ts'),
        'kebab-option': resolve(__dirname, 'src/components/kebab/index.ts'),
        'onboarding-background': resolve(__dirname, 'src/components/onboarding/index.ts'),
        'chip':     resolve(__dirname, 'src/components/chip/index.ts'),
        'tooltip':  resolve(__dirname, 'src/components/tooltip/index.ts'),
        'calendar':          resolve(__dirname, 'src/components/calendar/index.ts'),
        'calendar-extended': resolve(__dirname, 'src/components/calendar/calendar-extended.ts'),
        'select':            resolve(__dirname, 'src/components/select/index.ts'),
        'textarea':          resolve(__dirname, 'src/components/textarea/index.ts'),
        'currency-input':    resolve(__dirname, 'src/components/currency-input/index.ts'),
        'table':             resolve(__dirname, 'src/components/table/index.ts'),
        'stepper':           resolve(__dirname, 'src/components/stepper/index.ts'),
        'input-date':        resolve(__dirname, 'src/components/date-input/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['lit', /^lit\//],
    },
  },
});

import { AAA as BBB } from './types';
import { DiConfigTestClass } from '@src/config/DiConfigTestClass';

export class ConfigDiconfig {
    method(
        type: BBB.IDiConfigTest2,
    ): BBB.IDiConfigTest {
        return new DiConfigTestClass(type);
    }

    method2(): BBB.IDiConfigTest2 {
        return {
            someField: '',
        };
    }
}
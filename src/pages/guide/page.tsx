import { useTranslation } from 'react-i18next';
import Card from '../../components/base/Card';

export default function GuidePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 dark:text-white">{t('common:guide_title')}</h1>

        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4 dark:text-white">{t('common:step1_title')}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('common:step1_desc')}
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 dark:text-white">{t('common:step2_title')}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('common:step2_desc')}
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 dark:text-white">{t('common:step3_title')}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('common:step3_desc')}
              </p>
            </div>

            <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 rounded-lg p-6">
              <h3 className="font-bold mb-2 flex items-center dark:text-white">
                <i className="ri-information-line mr-2"></i>
                {t('common:important_notes')}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>{t('common:note1')}</li>
                <li>{t('common:note2')}</li>
                <li>{t('common:note3')}</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

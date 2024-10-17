import unittest
import requests

class TestCargaArchivosDICOM(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Configurar el endpoint que usaremos en todas las pruebas
        cls.api_endpoint = "http://localhost:3000/upload"  # Cambia la URL según tu configuración
        cls.archivos_dicom_validos = [
            "../../DATOS_DICOM/BSSFP/IMG-0002-00001.dcm",
            "../../DATOS_DICOM/BSSFP/IMG-0002-00002.dcm",
            "../../DATOS_DICOM/BSSFP/IMG-0002-00003.dcm",
            "../../DATOS_DICOM/Gd-MRA/IMG-0001-00001.dcm",
            "../../DATOS_DICOM/Gd-MRA/IMG-0001-00002.dcm",
            "../../DATOS_DICOM/Gd-MRA/IMG-0001-00003.dcm",
            "../../DATOS_DICOM/Covid_Scans/Subject/98.12.2/56364397.dcm", # Caso Frontera
            "../../DATOS_DICOM/Covid_Scans/Subject/98.12.2/56364398.dcm", # Caso Frontera
            "../../DATOS_DICOM/Covid_Scans/Subject/98.12.2/56364402.dcm", # Caso Frontera
        ]  # Lista de rutas a diferentes archivos DICOM válidos
        cls.archivos_no_validos = [
            "../../Hito_3_vf.pdf",
            "../../Hito_2_vf_PAUTA.xlsx",
            "../../Resumen_ingsof.docx",
            "../../prestigio.webp"
        ] # Lista de rutas a diferentes archivos NO validos

    def test_carga_archivo_dicom_valido(self):
        """
        Caso de prueba: Simular la carga de un archivo DICOM valido .
        """
        # Simula la carga de un archivo DICOM válido
        for archivo in self.archivos_dicom_validos:
            with self.subTest(archivo=archivo):
                with open(archivo, "rb") as archivo_valido:
                    files = {"image": archivo_valido}
                    response = requests.post(self.api_endpoint, files=files)

                    print(f"Probando archivo válido: {archivo}")

                    # Verificar el código de estado 200 OK
                    self.assertEqual(response.status_code, 200, f"Falló al cargar {archivo}. Status code: {response.status_code}. Mensaje: {response.text}")

                    # Verificar el mensaje de respuesta esperado
                    self.assertIn("El archivo es un DICOM válido", response.text, f"Respuesta inesperada para {archivo}. Respuesta: {response.text}")


    def test_carga_archivo_no_valido(self):
        """
        Simular la carga de un archivo no valido
        """
        # Simula la carga de un archivo no válido (PDF)
        for archivo in self.archivos_no_validos:
            with self.subTest(archivo=archivo):
                with open(archivo, "rb") as archivo_no_valido:
                    files = {"image": archivo_no_valido}
                    response = requests.post(self.api_endpoint, files=files)

                    print(f"Probando archivo no válido: {archivo}")

                    # Verificar el código de estado 400 Bad Request
                    self.assertEqual(response.status_code, 400, f"Prueba fallida para el archivo {archivo}: Se esperaba 400 Bad Request pero se obtuvo {response.status_code}. Mensaje: {response.text}")

                    # Verificar el mensaje de respuesta esperado
                    self.assertIn("Error al analizar el archivo, puede que no sea DICOM", response.text, f"Prueba fallida: Respuesta inesperada para {archivo}. Respuesta: {response.text}")

    @classmethod
    def tearDownClass(cls):
        print("Finalizaron las pruebas de subida de archivos DICOM")


if __name__ == '__main__':
    unittest.main()

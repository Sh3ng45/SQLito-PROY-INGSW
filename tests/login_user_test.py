import unittest
import requests

class TestLoginAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # URL base para las pruebas de autenticación
        cls.base_url = "http://localhost:3000/login"
        # Datos de usuario para el login (Formato JSON)
        cls.headers = {"Content-Type": "application/json"}
        cls.user_valid_data = [
            {"username": "vicho", "password": "1234"},
            {"username": "user2", "password": "2345"},
            {"username": "u", "password": "r"},
            {"username": "admin", "password": "admin"}
        ]
        cls.wrong_user_data = [
            {"username": "wrong_user", "password": "wrong_password"},
            {"username": "admin", "password": "wrong_password"},
            {"username": "wrong_user", "password": "admin"},
            {"username": "user2", "password": "1234"},
            {"username": "r", "password": "u"}, # Caso frontera
            {"username": "admin", "password": "admin123"}
        ]
            
    def test_login_exitoso_devuelve_token(self):
        """
        Caso de prueba: Verificar que el login exitoso devuelve un token.
        """
        for user_data in self.user_valid_data:
            with self.subTest(user_data=user_data):
                # Enviar la solicitud POST con las credenciales
                response = requests.post(self.base_url, json=user_data, headers=self.headers)

                print(f"\nProbando login exitoso con {user_data}")

                # Verificar que la respuesta sea 200 OK
                self.assertEqual(response.status_code, 200)

                # Verificar que el cuerpo de la respuesta contiene el token
                response_json = response.json()  # Convertir la respuesta a formato JSON

                # Asegurarse de que el campo 'token' está presente en la respuesta
                self.assertIn('token', response_json)

                # Verificar que el token no es una cadena vacía
                token = response_json['token']
                self.assertIsNotNone(token)
                self.assertNotEqual(token, "", "El token no debería estar vacío.")

                # Verificar si el token tiene el formato típico de un JWT
                self.assertTrue(token.count('.') == 2, "El token no parece ser un JWT válido")

    def test_login_fallido_no_devuelve_token(self):
        """
        Caso de prueba: Verificar que un login fallido no devuelve un token.
        """
        for user_data in self.wrong_user_data:
            with self.subTest(user_data=user_data):
                # Intentar hacer login con credenciales incorrectas
                response = requests.post(self.base_url, json=user_data)

                print(f"\nProbando login fallido con {user_data}")

                # Verificar que la respuesta sea 401 Unauthorized
                self.assertEqual(response.status_code, 401)

                # Si la respuesta contiene un mensaje de error, lo verificamos
                if response.headers.get('Content-Type') == 'application/json':
                    response_json = response.json()

                    # Verificar que el cuerpo de la respuesta no contiene el token
                    self.assertNotIn('token', response_json, "No se debería devolver un token para un login fallido.")

                    # Verificar el mensaje de error
                    expected_error_message = "Invalid username or password"
                    self.assertEqual(response_json.get('error'), expected_error_message, "Mensaje de error incorrecto.")
                else:
                    # Verificar que el cuerpo contenga el mensaje de error esperado
                    expected_error_message = "Login failed"
                    self.assertIn(expected_error_message, response.text, "El mensaje de error no es el esperado.")


    @classmethod
    def tearDownClass(cls):
        print("Finalizaron las pruebas de autenticación")

if __name__ == "__main__":
    unittest.main()

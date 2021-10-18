import formData from 'form-data';
    
let refreshToken = "0.ARoAv4j5cvGGr0GRqy180BHbR1hnqEHvVTVGljouYDMN2TAaAKI.AgABAAAAAAD--DLA3VO7QrddgJg7WevrAgDs_wQA9P_85Ht-xKc7R32y_6Q_XWTn2PYwla8PUX8eVwJjdGZ0jCRwz-JqBa4Hp0jh-nN-55zXrCX5Ua9jYf3Kl6aSeCtJIQI3zCL6S5GZovYf1Y0DFgMgHT8aW9j_-HPjSVJhJ52ey16K7FR-D_pdhTGTs5i15Xv9mob1Dd3LhNX7-vUW3Uai2UKlGoWAanIHRrDZuBFwESSNPNsLyjmQHn4PzQxhpmUovoKKZi1V7mGycwXgiKcriqW1ntk3mMxrtX9NK30CubNcfHuxrBGp1vvq_pMeIHIg93bCCGUy_vo2bAsPIAzgMPLvRQ27E4PGLl6YYuXuBc5TrSaSaOKTzRGjILIKyhyErWFR034aYsTPrn0sLfyFAryBDkO7ycYMeM7KMgOz2OjKIptzFbbDLIC3zNxsIpexBXLEFLB1A436o8W3oV6LHFWHvsU4MsapsfiksgJFR0C3yY0QRDuZAjlGWKplygSN6DQ9pHA1CVbli3e9qsduHUp_lf9Zdo_6TmoulGA7rTLEy-aiGePNo3CTiEtIwClIJLHsYQPSjHy0TkCTFZVpJIYKPye2Zsl6v5OaQqRLwl211VKAxYVAXRT_QLbm1ne91W4uTeqqzhU0YEDb6ZPhIcYxGk7HuFxuefct4vdUcoy5aKRgGo81UglQIL5b0NO7x5VOeIqT6CXXU2crY1wOwlYjwYpM1jva0GjBHMlT_ebPe6vBz2icXHhVLE14WMAFGQKeYsvXmhkJqN8derHm_PNdIrnWeAqKxaaOknHZLBV699oICaUDaRfQsX9Nu7Wg_lxl_CAUREx2RrJpGnZoJ1gZIlG4kiQVyS3RE77rsYErQP354i8Ih5_qCLjvvFiH13HJ4wqCe1r9kMIaGsnzwzt87X77eGEsAvHC7KFJf32zNTcQdqKJNBrkH4fbv_du7fsJNXLY6iI8yAol9hIsHQF339TjCfeSUfhG5dJicQGM5IUTaMUwnbl4EMDTbDaJ7r8R9q9qiIUzBx5D0tbUkzcoA5Fb3P6o3gSjRTcxPCZwX3HcV8Ohe4kpFDqCpF3VK2Oq4FLQidmoN2gJcKrywAhYg8ykTCU23IobX4NQ9QMaJhYSeGaNIohRugFn5pI57nBFbiJbcsk_gWkmzBH99pliDde95BV4SykKNtA7kpOp-_go2ziCXKejUsxT84dmFDPxWwiJRpILd1V_3yzDK6IL91d0udMFlXYVhgjH7CRpSPj-NMT2I0zgbtLcH6sJfvHkn6WGCUPqm614QxQoiGByXKmMXRFvA2ryWfviKqR6_qpZa-V-b9ocddN6U70uX1ySkPNzU80unM6GPFCFmFubBZNZ0gQ8dH16BfCDbboMnU1Vt5cDcdJpAhLMNyx2pTjEggifg6QV8Dhj7Xkbf8BG";

export async function getAuthToken(): Promise<string> {
    var clientId = "41a86758-55ef-4635-963a-2e60330dd930";
    var tokenEndpoint = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

    let formBody = new formData();
    formBody.append('grant_type', 'refresh_token');
    formBody.append('client_id', clientId);
    formBody.append('refresh_token', refreshToken);

    return new Promise((resolve, reject) => {
        formBody.submit(tokenEndpoint, (err: any, res: any) => {
            console.log('Auth error:' + err);
            res.on('data', (data: any) => {
                return resolve(JSON.parse(data.toString()).access_token);
            });

            res.on('error', (err: any) => {
                return reject(err);
            });
        });
    });
}
$(document).ready(function () {
    let currentEndpoint = "/api/classes";  // Inicia com Classes

    // Função para carregar a árvore com dados do JSON
    function loadTreeData(endpoint) {
        $('#jstree').jstree("destroy").empty();  // Limpa a árvore anterior

        $.ajax({
            url: endpoint,
            type: "GET",
            dataType: "json",
            success: function (data) {
                // Inicializa jsTree com os dados recebidos
                $('#jstree').jstree({
                    'core': {
                        'data': formatDataForIcons(data),  // Dados recebidos da API com ícones
                        'check_callback': true
                    },
                    'plugins': ["search", "wholerow"]
                });

                // Evento de seleção de nó
                $('#jstree').on('select_node.jstree', function (e, data) {
                    const selectedNode = data.node;
                    const ids = getIDsPath(selectedNode);  // Obtem os IDs corretos
                    $('#selected-label').val(ids);
                    fillFormFields(selectedNode, ids);  // Atualizado para passar os IDs corretamente
                });
            },
            error: function (xhr, status, error) {
                console.error("Erro ao carregar os dados da árvore:", error);
            }
        });
    }

    // Função para adicionar ícones para pastas e arquivos
    function formatDataForIcons(data) {
        return data.map(node => {
            if (node.children && node.children.length > 0) {
                // Nó pai: ícone de pasta
                node.icon = "fa fa-folder";
            } else {
                // Nó filho: ícone de arquivo
                node.icon = "fa fa-file-alt";
            }
            if (node.children) {
                node.children = formatDataForIcons(node.children);
            }
            return node;
        });
    }

    // Função para obter o caminho dos IDs (do pai até o nó selecionado)
    function getIDsPath(node) {
        let ids = [];
        let currentNode = node;

        // Enquanto houver nós pais, percorre a árvore
        while (currentNode) {
            let id = currentNode.id.split('-').pop();  // Extrai o ID real (sem o prefixo)
            if (id.startsWith('#')) {
                id = id.substring(1);  // Remove o "#" do início do ID
            }
            ids.push(id);
            currentNode = $('#jstree').jstree(true).get_node(currentNode.parent);
        }

        // Remove duplicatas e ids vazios
        ids = ids.reverse().filter((id, index, self) => self.indexOf(id) === index && id !== '');  

        // Completa com 0 até que a lista tenha exatamente 5 IDs
        while (ids.length < 5) {
            ids.push('0');
        }

        // Retorna os IDs em ordem e separados por vírgulas
        return ids.join(',');
    }

    // Função para preencher os campos do formulário com base na seleção
    function fillFormFields(node, ids) {
        const id = node.id.split('-').pop();  // Extrai apenas o código (sem a descrição)

        // Preenche os campos de nível com base no tipo (classe ou assunto)
        if (currentEndpoint === "/api/classes") {
            $('#codigo_classe').val(id);  // Preenche apenas o código da classe
        } else if (currentEndpoint === "/api/assuntos") {
            $('#codigo_assunto').val(id);  // Preenche apenas o código do assunto
        }
    }

    // Função de pesquisa na árvore
    $('#search-input').keyup(function () {
        const searchValue = $(this).val();
        $('#jstree').jstree(true).search(searchValue);

        // Fecha todos os nós se o campo de pesquisa estiver vazio
        if (searchValue === '') {
            $('#jstree').jstree('close_all');
        }
    });

    // Carrega a árvore de classes por padrão
    loadTreeData(currentEndpoint);

    // Alternar entre classes e assuntos
    $('#load-classes').click(function () {
        currentEndpoint = "/api/classes";
        loadTreeData(currentEndpoint);
    });

    $('#load-assuntos').click(function () {
        currentEndpoint = "/api/assuntos";
        loadTreeData(currentEndpoint);
    });

    // Carregar órgãos para o combobox
    $.ajax({
        url: "/api/orgaos",
        type: "GET",
        success: function (data) {
            const select = $('#orgao-select');
            select.empty();  // Limpa o select antes de carregar novos dados
            data.forEach(orgao => {
                select.append(`<option value="${orgao.orgao_codigo}">${orgao.orgao_nome}</option>`);
            });
        },
        error: function (xhr, status, error) {
            console.error("Erro ao carregar os órgãos:", error);
        }
    });

    // Captura o órgão selecionado e preenche o campo hidden
    $('#orgao-select').change(function () {
        const selectedValue = $(this).val();
        $('#orgao_codigo').val(selectedValue);
    });

    // Função de submissão do formulário
    $('#submission-form').submit(function (e) {
        e.preventDefault();

        // Obtem IDs dos níveis diretamente para submissão
        const levels = $('#selected-label').val().split(',');

        const formData = {
            grau: $('#grau-select').val(),
            codigo_classe: $('#codigo_classe').val(),
            codigo_assunto: $('#codigo_assunto').val(),
            //codigo_formato: $('#codigo_formato-select').val(),
            orgao_codigo: $('#orgao_codigo').val(),
            classe_nivel1: levels[0] || '0',
            classe_nivel2: levels[1] || '0',
            classe_nivel3: levels[2] || '0',
            classe_nivel4: levels[3] || '0',
            classe_nivel5: levels[4] || '0',
            assunto_nivel1: levels[0] || '0',
            assunto_nivel2: levels[1] || '0',
            assunto_nivel3: levels[2] || '0',
            assunto_nivel4: levels[3] || '0',
            assunto_nivel5: levels[4] || '0'
        };

        console.log("Dados do formulário:", formData);

      
        $.ajax({
            url: 'http://127.0.0.1:8000/predict',  
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                console.log("Resposta do servidor externo:", response);
                alert("Seu tempo de julgamento será: " + response);
                $('#response-message').text("Seu tempo de julgamento será: " + response);  
                $('#response-message').addClass('text-white');
            },
            error: function (xhr, status, error) {
                console.error("Erro ao enviar dados:", error);
        
            }
        });
    });
});
